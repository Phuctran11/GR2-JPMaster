import databaseService from "../../services/database.service.js";
import type { PoolClient } from "pg";
import type { AdminQuizQuestionInput } from "../admin.model.js";

type QuestionOptionInput = AdminQuizQuestionInput["options"][number];

export async function getOptionsByQuestionIds(questionIds: number[]) {
  const optionsByQuestion = new Map<number, unknown[]>();

  if (!questionIds.length) {
    return optionsByQuestion;
  }

  const optionResult = await databaseService.executeQuery(
    `
      SELECT option_id, question_id, option_text, is_correct, explanation
      FROM "Option"
      WHERE question_id = ANY($1::int[])
      ORDER BY option_id ASC;
    `,
    [questionIds]
  );

  optionResult.rows.forEach((option) => {
    const options = optionsByQuestion.get(option.question_id) ?? [];
    options.push({ ...option, is_correct: Boolean(option.is_correct) });
    optionsByQuestion.set(option.question_id, options);
  });

  return optionsByQuestion;
}

export async function insertQuestionOptions(
  client: PoolClient,
  questionId: number,
  options: QuestionOptionInput[]
): Promise<number[]> {
  if (!options.length) return [];

  const result = await client.query(
    `
      INSERT INTO "Option" (question_id, option_text, is_correct, explanation, created_at, updated_at)
      SELECT $1, option_text, is_correct, explanation, NOW(), NOW()
      FROM UNNEST($2::text[], $3::boolean[], $4::text[])
        AS option_rows(option_text, is_correct, explanation)
      RETURNING option_id;
    `,
    [
      questionId,
      options.map((option) => option.option_text),
      options.map((option) => option.is_correct),
      options.map((option) => option.explanation ?? null),
    ]
  );

  return result.rows.map((row) => Number(row.option_id));
}

export async function replaceQuestionOptions(
  client: PoolClient,
  questionId: number,
  options: QuestionOptionInput[]
): Promise<number[]> {
  const retainedOptionIds: number[] = [];
  const newOptions: QuestionOptionInput[] = [];

  for (const option of options) {
    if (option.option_id) {
      await client.query(
        `
          UPDATE "Option"
          SET option_text = $1, is_correct = $2, explanation = $3, updated_at = NOW()
          WHERE option_id = $4 AND question_id = $5;
        `,
        [option.option_text, option.is_correct, option.explanation ?? null, option.option_id, questionId]
      );
      retainedOptionIds.push(option.option_id);
    } else {
      newOptions.push(option);
    }
  }

  retainedOptionIds.push(...await insertQuestionOptions(client, questionId, newOptions));

  const referencedRemovedOptions = await client.query(
    `
      SELECT 1
      FROM "Option" o
      WHERE o.question_id = $1
        AND NOT (o.option_id = ANY($2::int[]))
        AND EXISTS (SELECT 1 FROM "UserAnswer" ua WHERE ua.option_id = o.option_id)
      LIMIT 1;
    `,
    [questionId, retainedOptionIds]
  );

  if (referencedRemovedOptions.rowCount) {
    const error = new Error("Cannot remove options that already have learner answers");
    (error as Error & { status?: number }).status = 409;
    throw error;
  }

  await client.query(
    `
      DELETE FROM "Option"
      WHERE question_id = $1
        AND NOT (option_id = ANY($2::int[]));
    `,
    [questionId, retainedOptionIds]
  );

  return retainedOptionIds;
}
