import type { PoolClient } from "pg";
import type { JlptLevel, SectionType } from "../admin.model.js";
import type { AutoJlptDifficulty } from "./jlptQuestions.auto.types.js";

interface FindAutoJlptQuestionCandidatesInput {
  sectionId: number;
  sectionType: SectionType;
  jlptLevel: JlptLevel;
  difficulty: AutoJlptDifficulty;
  limit: number;
  excludedQuestionIds: number[];
  ownerId?: number;
}

export const findAutoJlptQuestionCandidates = async (
  client: PoolClient,
  input: FindAutoJlptQuestionCandidatesInput
): Promise<number[]> => {
  const params: unknown[] = [
    input.sectionId,
    input.sectionType,
    input.jlptLevel,
    input.difficulty,
    input.limit,
    input.excludedQuestionIds,
  ];
  if (input.ownerId) params.push(input.ownerId);

  const result = await client.query(
    `
      SELECT q.question_id
      FROM "Question" q
      LEFT JOIN "JLPTSectionQuestion" used_jsq
        ON used_jsq.question_id = q.question_id
       AND used_jsq.deleted_at IS NULL
      LEFT JOIN "JLPTSection" used_section
        ON used_section.section_id = used_jsq.section_id
       AND used_section.deleted_at IS NULL
      LEFT JOIN "JLPTExam" used_exam
        ON used_exam.exam_id = used_section.exam_id
       AND used_exam.deleted_at IS NULL
      WHERE q.deleted_at IS NULL
        AND q.section_type = $2
        AND q.jlpt_level = $3
        AND q.difficulty_level = $4
        AND NOT (q.question_id = ANY($6::int[]))
        AND NOT EXISTS (
          SELECT 1
          FROM "JLPTSectionQuestion" existing
          WHERE existing.section_id = $1
            AND existing.question_id = q.question_id
            AND existing.deleted_at IS NULL
        )
        AND EXISTS (
          SELECT 1
          FROM "Option" o
          WHERE o.question_id = q.question_id
            AND o.is_correct = TRUE
        )
        AND (SELECT COUNT(*) FROM "Option" o WHERE o.question_id = q.question_id) >= 2
        ${input.ownerId ? "AND q.created_by = $7" : ""}
      GROUP BY q.question_id, q.created_at
      ORDER BY COUNT(used_exam.exam_id) ASC, q.created_at ASC, q.question_id ASC
      LIMIT $5;
    `,
    params
  );

  return result.rows.map((row) => Number(row.question_id));
};
