import type { PoolClient } from "pg";
import databaseService from "../../services/database.service.js";
import { buildJlptUserAnswerRows } from "./jlptAnswerRows.js";
import type { JlptGradingOption } from "./jlptExam.grading.js";
import type { JlptQuestionResult } from "./jlptExam.types.js";
import { assertReturnedRow } from "../modelAssertions.js";

export const getJlptOptionsByQuestion = async (questionIds: number[]) => {
  const optionResult = questionIds.length
    ? await databaseService.executeQuery(
        `
          SELECT option_id, question_id, option_text, is_correct
          FROM "Option"
          WHERE question_id = ANY($1::int[]);
        `,
        [questionIds]
      )
    : { rows: [] };

  const optionsByQuestion = new Map<number, JlptGradingOption[]>();
  optionResult.rows.forEach((option) => {
    const options = optionsByQuestion.get(option.question_id) ?? [];
    options.push({ ...option, is_correct: Boolean(option.is_correct) });
    optionsByQuestion.set(option.question_id, options);
  });

  return optionsByQuestion;
};

export const createJlptAttempt = async (
  client: PoolClient,
  input: {
    userId: number;
    examId: number;
    score: number;
    totalMarks: number;
    status: "graded" | "submitted";
  }
) => {
  const attemptResult = await client.query(
    `
      INSERT INTO "QuizAttempt" (user_id, jlpt_exam_id, started_at, submitted_at, score, total_marks, status)
      VALUES ($1, $2, NOW(), NOW(), $3, $4, $5)
      RETURNING attempt_id, submitted_at;
    `,
    [input.userId, input.examId, input.score, input.totalMarks, input.status]
  );

  return assertReturnedRow(attemptResult.rows[0], "Failed to create JLPT attempt");
};

export const insertJlptUserAnswers = async (
  client: PoolClient,
  attemptId: number,
  questionResults: JlptQuestionResult[]
) => {
  const answerRows = buildJlptUserAnswerRows(attemptId, questionResults);

  if (answerRows.length === 0) return;

  await client.query(
    `
      INSERT INTO "UserAnswer" (
        attempt_id, question_id, jlpt_section_id, option_id, answer_text, is_correct, answered_at
      )
      SELECT attempt_id, question_id, jlpt_section_id, option_id, answer_text, is_correct, NOW()
      FROM UNNEST($1::int[], $2::int[], $3::int[], $4::int[], $5::text[], $6::boolean[])
        AS answer_rows(attempt_id, question_id, jlpt_section_id, option_id, answer_text, is_correct);
    `,
    [
      answerRows.map((row) => row.attemptId),
      answerRows.map((row) => row.questionId),
      answerRows.map((row) => row.sectionId),
      answerRows.map((row) => row.optionId),
      answerRows.map((row) => row.answerText),
      answerRows.map((row) => row.isCorrect),
    ]
  );
};
