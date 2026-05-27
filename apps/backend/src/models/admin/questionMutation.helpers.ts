import type { PoolClient } from "pg";
import type { AdminQuizQuestionInput } from "../admin.model.js";

type QuestionMediaInput = {
  audio_asset_id?: number | null;
  audio_url?: string | null;
};

export async function readingPassageExists(client: PoolClient, passageId: number, ownerId?: number): Promise<boolean> {
  const passageResult = await client.query(
    `
      SELECT passage_id
      FROM "ReadingPassage"
      WHERE passage_id = $1
        AND deleted_at IS NULL
        ${ownerId ? "AND created_by = $2" : ""};
    `,
    ownerId ? [passageId, ownerId] : [passageId]
  );
  return Boolean(passageResult.rowCount);
}

export async function validateReadingPassageForSection(
  client: PoolClient,
  sectionType: string | null | undefined,
  readingPassageId: number | null | undefined,
  ownerId?: number
): Promise<boolean> {
  if (sectionType !== "reading") {
    return true;
  }
  if (!readingPassageId) {
    return false;
  }
  return readingPassageExists(client, readingPassageId, ownerId);
}

export async function insertAdminQuestion(
  client: PoolClient,
  input: AdminQuizQuestionInput,
  createdBy: number,
  sectionType: string | null | undefined,
  media: QuestionMediaInput = input
): Promise<number> {
  const questionResult = await client.query(
    `
      INSERT INTO "Question" (
        question_text, question_type, difficulty_level, explanation, points,
        jlpt_level, section_type, reading_passage_id, image_asset_id, image_url, audio_asset_id, audio_url,
        created_by, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING question_id;
    `,
    [
      input.question_text,
      input.question_type,
      input.difficulty_level ?? null,
      input.explanation ?? null,
      input.points,
      input.jlpt_level ?? null,
      sectionType ?? null,
      sectionType === "reading" ? input.reading_passage_id ?? null : null,
      input.image_asset_id ?? null,
      input.image_url ?? null,
      media.audio_asset_id ?? null,
      media.audio_url ?? null,
      createdBy,
    ]
  );
  return Number(questionResult.rows[0].question_id);
}

export async function updateAdminQuestion(
  client: PoolClient,
  questionId: number,
  input: AdminQuizQuestionInput,
  sectionType: string | null | undefined,
  media: QuestionMediaInput = input
): Promise<void> {
  await client.query(
    `
      UPDATE "Question"
      SET question_text = $1,
          question_type = $2,
          difficulty_level = $3,
          explanation = $4,
          points = $5,
          jlpt_level = $6,
          section_type = $7,
          reading_passage_id = $8,
          image_asset_id = $9,
          image_url = $10,
          audio_asset_id = $11,
          audio_url = $12,
          updated_at = NOW()
      WHERE question_id = $13;
    `,
    [
      input.question_text,
      input.question_type,
      input.difficulty_level ?? null,
      input.explanation ?? null,
      input.points,
      input.jlpt_level ?? null,
      sectionType ?? null,
      sectionType === "reading" ? input.reading_passage_id ?? null : null,
      input.image_asset_id ?? null,
      input.image_url ?? null,
      media.audio_asset_id ?? null,
      media.audio_url ?? null,
      questionId,
    ]
  );
}

export async function recalculateQuizTotalMarks(client: PoolClient, quizId: number): Promise<void> {
  await client.query(
    `
      UPDATE "Quiz"
      SET total_marks = COALESCE((
            SELECT SUM(COALESCE(marks, 0))
            FROM "QuizQuestion"
            WHERE quiz_id = $1
              AND deleted_at IS NULL
          ), 0),
          updated_at = NOW()
      WHERE quiz_id = $1;
    `,
    [quizId]
  );
}
