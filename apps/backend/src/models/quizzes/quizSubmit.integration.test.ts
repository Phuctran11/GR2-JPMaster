import assert from "node:assert/strict";
import { after } from "node:test";
import pool from "../../config/database.js";
import databaseService from "../../services/database.service.js";
import { assertIntegrationDatabaseAllowed, integrationTest, runIntegrationTests } from "../integrationTest.helpers.js";
import quizSubmitModel from "./quiz.submit.model.js";

assertIntegrationDatabaseAllowed();

const testRunId = `quiz_it_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const createdUserIds: number[] = [];
const createdQuizIds: number[] = [];
const createdQuestionIds: number[] = [];

const seedQuiz = async () => {
  const userResult = await databaseService.executeQuery(
    `
      INSERT INTO "User" (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, 'integration-test-password-hash', 'learner', 'active', NOW(), NOW())
      RETURNING user_id;
    `,
    [`${testRunId}_user_${createdUserIds.length}`, `${testRunId}_${createdUserIds.length}@example.test`]
  );
  const user = userResult.rows[0];
  createdUserIds.push(user.user_id);

  const quizResult = await databaseService.executeQuery(
    `
      INSERT INTO "Quiz" (title, description, quiz_type, passing_score, total_marks, time_limit_minutes, created_by, created_at, updated_at)
      VALUES ($1, 'Integration quiz', 'practice_test', 70, 2, NULL, $2, NOW(), NOW())
      RETURNING quiz_id;
    `,
    [`${testRunId}_quiz_${createdQuizIds.length}`, user.user_id]
  );
  const quiz = quizResult.rows[0];
  createdQuizIds.push(quiz.quiz_id);

  const singleQuestionResult = await databaseService.executeQuery(
    `
      INSERT INTO "Question" (question_text, question_type, points, created_by, created_at, updated_at)
      VALUES ('Single choice?', 'single_choice', 1, $1, NOW(), NOW())
      RETURNING question_id;
    `,
    [user.user_id]
  );
  const singleQuestion = singleQuestionResult.rows[0];
  createdQuestionIds.push(singleQuestion.question_id);

  const fillQuestionResult = await databaseService.executeQuery(
    `
      INSERT INTO "Question" (question_text, question_type, points, created_by, created_at, updated_at)
      VALUES ('Fill blank?', 'fill_in_blank', 1, $1, NOW(), NOW())
      RETURNING question_id;
    `,
    [user.user_id]
  );
  const fillQuestion = fillQuestionResult.rows[0];
  createdQuestionIds.push(fillQuestion.question_id);

  await databaseService.executeQuery(
    `
      INSERT INTO "QuizQuestion" (quiz_id, question_id, order_index, marks)
      VALUES ($1, $2, 1, 1), ($1, $3, 2, 1);
    `,
    [quiz.quiz_id, singleQuestion.question_id, fillQuestion.question_id]
  );

  const optionResult = await databaseService.executeQuery(
    `
      INSERT INTO "Option" (question_id, option_text, is_correct, created_at, updated_at)
      VALUES
        ($1, 'correct', TRUE, NOW(), NOW()),
        ($1, 'wrong', FALSE, NOW(), NOW()),
        ($2, 'nihongo', TRUE, NOW(), NOW())
      RETURNING option_id, question_id, is_correct;
    `,
    [singleQuestion.question_id, fillQuestion.question_id]
  );

  const correctSingleOption = optionResult.rows.find((option) => option.question_id === singleQuestion.question_id && option.is_correct);

  return { user, quiz, singleQuestion, fillQuestion, correctSingleOption };
};

after(async () => {
  if (runIntegrationTests) {
    await databaseService.executeQuery(
      `DELETE FROM "UserAnswer" WHERE attempt_id IN (SELECT attempt_id FROM "QuizAttempt" WHERE user_id = ANY($1::int[]))`,
      [createdUserIds]
    );
    await databaseService.executeQuery(`DELETE FROM "QuizAttempt" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
    await databaseService.executeQuery(`DELETE FROM "QuizQuestion" WHERE quiz_id = ANY($1::int[])`, [createdQuizIds]);
    await databaseService.executeQuery(`DELETE FROM "Option" WHERE question_id = ANY($1::int[])`, [createdQuestionIds]);
    await databaseService.executeQuery(`DELETE FROM "Question" WHERE question_id = ANY($1::int[])`, [createdQuestionIds]);
    await databaseService.executeQuery(`DELETE FROM "Quiz" WHERE quiz_id = ANY($1::int[])`, [createdQuizIds]);
    await databaseService.executeQuery(`DELETE FROM "User" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
  }

  await pool.end();
});

integrationTest("submitQuiz inserts graded attempt and user answers", async () => {
  const { user, quiz, singleQuestion, fillQuestion, correctSingleOption } = await seedQuiz();

  const result = await quizSubmitModel.submitQuiz(user.user_id, quiz.quiz_id, [
    { question_id: singleQuestion.question_id, option_id: correctSingleOption.option_id },
    { question_id: fillQuestion.question_id, answer_text: " nihongo " },
  ]);

  assert.ok(result);
  assert.equal(result.score, 100);
  assert.equal(result.passed, true);

  const answerResult = await databaseService.executeQuery(
    `
      SELECT question_id, option_id, answer_text, is_correct
      FROM "UserAnswer"
      WHERE attempt_id = $1
      ORDER BY question_id, option_id NULLS LAST;
    `,
    [result.attempt_id]
  );

  assert.equal(answerResult.rows.length, 2);
  assert.equal(answerResult.rows.some((row) => row.question_id === fillQuestion.question_id && row.option_id === null), true);
});

integrationTest("submitQuiz updates in-progress attempt when attempt id is provided", async () => {
  const { user, quiz, singleQuestion, correctSingleOption } = await seedQuiz();

  const attemptResult = await databaseService.executeQuery(
    `
      INSERT INTO "QuizAttempt" (user_id, quiz_id, started_at, status)
      VALUES ($1, $2, NOW(), 'in_progress')
      RETURNING attempt_id;
    `,
    [user.user_id, quiz.quiz_id]
  );
  const attemptId = attemptResult.rows[0].attempt_id;

  const result = await quizSubmitModel.submitQuiz(
    user.user_id,
    quiz.quiz_id,
    [{ question_id: singleQuestion.question_id, option_id: correctSingleOption.option_id }],
    attemptId
  );

  assert.ok(result);
  assert.equal(result.attempt_id, attemptId);
});
