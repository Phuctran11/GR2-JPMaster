import assert from "node:assert/strict";
import { after } from "node:test";
import pool from "../../config/database.js";
import databaseService from "../../services/database.service.js";
import { assertIntegrationDatabaseAllowed, integrationTest, runIntegrationTests } from "../integrationTest.helpers.js";
import jlptExamSubmitModel from "./jlptExam.submit.model.js";

assertIntegrationDatabaseAllowed();

const testRunId = `jit_${Math.floor(Math.random() * 100000).toString(36)}`;
const createdUserIds: number[] = [];
const createdExamIds: number[] = [];
const createdSectionIds: number[] = [];
const createdQuestionIds: number[] = [];

const createSeedUser = async (role: "learner" | "owner") => {
  const userResult = await databaseService.executeQuery(
    `
      INSERT INTO "User" (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, 'integration-test-password-hash', $3, 'active', NOW(), NOW())
      RETURNING user_id;
    `,
    [`${testRunId}_${role}_${createdUserIds.length}`, `${testRunId}_${role}_${createdUserIds.length}@example.test`, role]
  );
  const user = userResult.rows[0];
  createdUserIds.push(user.user_id);
  return user;
};

const seedJlptExam = async () => {
  const learner = await createSeedUser("learner");
  const owner = await createSeedUser("owner");

  const examResult = await databaseService.executeQuery(
    `
      INSERT INTO "JLPTExam" (title, jlpt_level, year, duration_minutes, created_by, created_at, updated_at)
      VALUES ($1, 'N5', 2026, 30, $2, NOW(), NOW())
      RETURNING exam_id;
    `,
    [`${testRunId}_exam_${createdExamIds.length}`, owner.user_id]
  );
  const exam = examResult.rows[0];
  createdExamIds.push(exam.exam_id);

  const sectionResult = await databaseService.executeQuery(
    `
      INSERT INTO "JLPTSection" (exam_id, title, section_type, section_order, duration_minutes, updated_at)
      VALUES ($1, 'Vocabulary', 'vocabulary', 1, 30, NOW())
      RETURNING section_id;
    `,
    [exam.exam_id]
  );
  const section = sectionResult.rows[0];
  createdSectionIds.push(section.section_id);

  const singleQuestionResult = await databaseService.executeQuery(
    `
      INSERT INTO "Question" (question_text, question_type, points, jlpt_level, section_type, created_by, created_at, updated_at)
      VALUES ('Choose the correct word?', 'single_choice', 1, 'N5', 'vocabulary', $1, NOW(), NOW())
      RETURNING question_id;
    `,
    [owner.user_id]
  );
  const singleQuestion = singleQuestionResult.rows[0];
  createdQuestionIds.push(singleQuestion.question_id);

  const fillQuestionResult = await databaseService.executeQuery(
    `
      INSERT INTO "Question" (question_text, question_type, points, jlpt_level, section_type, created_by, created_at, updated_at)
      VALUES ('Type the correct reading?', 'fill_in_blank', 1, 'N5', 'vocabulary', $1, NOW(), NOW())
      RETURNING question_id;
    `,
    [owner.user_id]
  );
  const fillQuestion = fillQuestionResult.rows[0];
  createdQuestionIds.push(fillQuestion.question_id);

  await databaseService.executeQuery(
    `
      INSERT INTO "JLPTSectionQuestion" (section_id, question_id, order_index)
      VALUES ($1, $2, 1), ($1, $3, 2);
    `,
    [section.section_id, singleQuestion.question_id, fillQuestion.question_id]
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
  const correctSingleOption = optionResult.rows.find(
    (option) => option.question_id === singleQuestion.question_id && option.is_correct
  );
  const wrongSingleOption = optionResult.rows.find(
    (option) => option.question_id === singleQuestion.question_id && !option.is_correct
  );

  return { learner, exam, section, singleQuestion, fillQuestion, correctSingleOption, wrongSingleOption };
};

after(async () => {
  if (runIntegrationTests) {
    await databaseService.executeQuery(
      `DELETE FROM "UserAnswer" WHERE attempt_id IN (SELECT attempt_id FROM "QuizAttempt" WHERE user_id = ANY($1::int[]))`,
      [createdUserIds]
    );
    await databaseService.executeQuery(`DELETE FROM "QuizAttempt" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
    await databaseService.executeQuery(`DELETE FROM "JLPTSectionQuestion" WHERE section_id = ANY($1::int[])`, [
      createdSectionIds,
    ]);
    await databaseService.executeQuery(`DELETE FROM "Option" WHERE question_id = ANY($1::int[])`, [createdQuestionIds]);
    await databaseService.executeQuery(`DELETE FROM "Question" WHERE question_id = ANY($1::int[])`, [createdQuestionIds]);
    await databaseService.executeQuery(`DELETE FROM "JLPTSection" WHERE section_id = ANY($1::int[])`, [createdSectionIds]);
    await databaseService.executeQuery(`DELETE FROM "JLPTExam" WHERE exam_id = ANY($1::int[])`, [createdExamIds]);
    await databaseService.executeQuery(`DELETE FROM "User" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
  }

  await pool.end();
});

integrationTest("submitExam inserts JLPT attempt and section answer rows", async () => {
  const { learner, exam, section, singleQuestion, fillQuestion, correctSingleOption } = await seedJlptExam();

  const result = await jlptExamSubmitModel.submitExam(learner.user_id, exam.exam_id, [
    { question_id: singleQuestion.question_id, option_id: correctSingleOption.option_id },
    { question_id: fillQuestion.question_id, answer_text: " nihongo " },
  ]);

  assert.ok(result);
  assert.equal(result.score, 100);
  assert.equal(result.passed, true);

  const answerResult = await databaseService.executeQuery(
    `
      SELECT question_id, jlpt_section_id, option_id, answer_text, is_correct
      FROM "UserAnswer"
      WHERE attempt_id = $1
      ORDER BY question_id, option_id NULLS LAST;
    `,
    [result.attempt_id]
  );

  assert.equal(answerResult.rows.length, 2);
  assert.equal(
    answerResult.rows.some(
      (row) =>
        row.question_id === fillQuestion.question_id &&
        row.jlpt_section_id === section.section_id &&
        row.option_id === null &&
        row.is_correct
    ),
    true
  );
});

integrationTest("submitExam keeps failed JLPT attempts submitted", async () => {
  const { learner, exam, singleQuestion, wrongSingleOption } = await seedJlptExam();

  const result = await jlptExamSubmitModel.submitExam(learner.user_id, exam.exam_id, [
    { question_id: singleQuestion.question_id, option_id: wrongSingleOption.option_id },
  ]);

  assert.ok(result);
  assert.equal(result.passed, false);

  const attemptResult = await databaseService.executeQuery(
    `
      SELECT status
      FROM "QuizAttempt"
      WHERE attempt_id = $1;
    `,
    [result.attempt_id]
  );
  assert.equal(attemptResult.rows[0].status, "submitted");
});
