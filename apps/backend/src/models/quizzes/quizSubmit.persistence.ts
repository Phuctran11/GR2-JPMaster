import type { PoolClient } from "pg";
import { buildQuizUserAnswerRows } from "./quizAnswerRows.js";
import type { GradedQuizAnswer } from "./quiz.grading.js";
import { assertReturnedRow } from "../modelAssertions.js";

export const upsertGradedQuizAttempt = async (
  client: PoolClient,
  input: {
    userId: number;
    quizId: number;
    score: number;
    totalMarks: number;
    attemptId?: number;
  }
) => {
  let attemptResult;
  if (input.attemptId) {
    attemptResult = await client.query(
      `
        UPDATE "QuizAttempt"
        SET submitted_at = NOW(), score = $1, total_marks = $2, status = 'graded'
        WHERE attempt_id = $3
          AND user_id = $4
          AND quiz_id = $5
          AND status = 'in_progress'
        RETURNING attempt_id, quiz_id, score, total_marks, status, started_at, submitted_at;
      `,
      [input.score, input.totalMarks, input.attemptId, input.userId, input.quizId]
    );
  }

  if (attemptResult?.rows[0]) {
    return attemptResult.rows[0];
  }

  const createdAttemptResult = await client.query(
    `
      INSERT INTO "QuizAttempt" (user_id, quiz_id, started_at, submitted_at, score, total_marks, status)
      VALUES ($1, $2, NOW(), NOW(), $3, $4, 'graded')
      RETURNING attempt_id, quiz_id, score, total_marks, status, started_at, submitted_at;
    `,
    [input.userId, input.quizId, input.score, input.totalMarks]
  );

  return assertReturnedRow(createdAttemptResult.rows[0], "Failed to create quiz attempt");
};

export const insertQuizUserAnswers = async (
  client: PoolClient,
  attemptId: number,
  gradedAnswers: GradedQuizAnswer[]
) => {
  const answerRows = buildQuizUserAnswerRows(attemptId, gradedAnswers);

  if (answerRows.length === 0) return;

  await client.query(
    `
      INSERT INTO "UserAnswer" (attempt_id, question_id, option_id, answer_text, is_correct, answered_at)
      SELECT attempt_id, question_id, option_id, answer_text, is_correct, NOW()
      FROM UNNEST($1::int[], $2::int[], $3::int[], $4::text[], $5::boolean[])
        AS answer_rows(attempt_id, question_id, option_id, answer_text, is_correct);
    `,
    [
      answerRows.map((row) => row.attemptId),
      answerRows.map((row) => row.questionId),
      answerRows.map((row) => row.optionId),
      answerRows.map((row) => row.answerText),
      answerRows.map((row) => row.isCorrect),
    ]
  );
};
