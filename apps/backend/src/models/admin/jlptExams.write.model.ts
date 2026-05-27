import databaseService from "../../services/database.service.js";
import { assertReturnedRow } from "../modelAssertions.js";
import type { AdminJlptSectionInput, JlptLevel } from "../admin.model.js";
import { buildUpdateSet } from "./adminModelHelpers.js";
import { insertJlptExamSections } from "./jlptExams.helpers.js";

class AdminJlptExamsWriteModel {
  async createJlptExam(input: {
    title: string;
    jlpt_level: JlptLevel;
    year: number | null;
    duration_minutes: number | null;
    created_by: number;
    sections: AdminJlptSectionInput[];
  }) {
    return databaseService.withTransaction(async (client) => {
      const examResult = await client.query(
        `
          INSERT INTO "JLPTExam" (title, jlpt_level, year, duration_minutes, created_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING exam_id, title, jlpt_level, year, duration_minutes, created_by, created_at, updated_at;
        `,
        [input.title, input.jlpt_level, input.year, input.duration_minutes, input.created_by]
      );
      const exam = assertReturnedRow(examResult.rows[0], "Failed to create JLPT exam");

      await insertJlptExamSections(client, exam.exam_id, input.sections);

      return exam;
    });
  }

  async updateJlptExam(
    examId: number,
    input: Partial<{ title: string; jlpt_level: JlptLevel; year: number | null; duration_minutes: number | null }>,
    ownerId?: number
  ) {
    const fields = ["title", "jlpt_level", "year", "duration_minutes"] as const;
    const { updates, values } = buildUpdateSet(input, fields);

    if (!updates.length) return null;
    values.push(examId);
    if (ownerId) values.push(ownerId);
    const result = await databaseService.executeQuery(
      `
        UPDATE "JLPTExam"
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE exam_id = $${ownerId ? values.length - 1 : values.length}
          AND deleted_at IS NULL
          ${ownerId ? `AND created_by = $${values.length}` : ""}
        RETURNING exam_id, title, jlpt_level, year, duration_minutes, created_by, created_at, updated_at;
      `,
      values
    );
    return result.rows[0] || null;
  }

  async deleteJlptExam(examId: number, ownerId?: number): Promise<boolean> {
    return databaseService.withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT exam_id FROM "JLPTExam" WHERE exam_id = $1 AND deleted_at IS NULL ${ownerId ? "AND created_by = $2" : ""};`,
        ownerId ? [examId, ownerId] : [examId]
      );
      if (!existing.rowCount) {
        return false;
      }

      await client.query(
        `
          UPDATE "JLPTSectionQuestion"
          SET deleted_at = COALESCE(deleted_at, NOW())
          WHERE section_id IN (SELECT section_id FROM "JLPTSection" WHERE exam_id = $1)
            AND deleted_at IS NULL;
        `,
        [examId]
      );
      await client.query(
        `
          UPDATE "JLPTSection"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE exam_id = $1
            AND deleted_at IS NULL;
        `,
        [examId]
      );
      await client.query(
        `
          UPDATE "JLPTExam"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE exam_id = $1
            AND deleted_at IS NULL;
        `,
        [examId]
      );
      return true;
    });
  }
}

export default new AdminJlptExamsWriteModel();
