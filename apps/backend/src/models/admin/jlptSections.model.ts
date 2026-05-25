import databaseService from "../../services/database.service.js";
import { AdminJlptSectionInput } from "../admin.model.js";
import { buildUpdateSet } from "./adminModelHelpers.js";

class AdminJlptSectionsModel {
  async listJlptSections(examId: number, ownerId?: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT s.section_id, s.exam_id, s.title, s.section_type, s.section_order, s.duration_minutes,
               s.audio_asset_id, s.audio_url, s.deleted_at, s.updated_at,
               COUNT(jsq.question_id)::int AS question_count
        FROM "JLPTSection" s
        JOIN "JLPTExam" e ON e.exam_id = s.exam_id
        LEFT JOIN "JLPTSectionQuestion" jsq ON jsq.section_id = s.section_id AND jsq.deleted_at IS NULL
        WHERE s.exam_id = $1
          AND s.deleted_at IS NULL
          AND e.deleted_at IS NULL
          ${ownerId ? "AND e.created_by = $2" : ""}
        GROUP BY s.section_id
        ORDER BY s.section_order ASC NULLS LAST, s.section_id ASC;
      `,
      ownerId ? [examId, ownerId] : [examId]
    );
    return result.rows;
  }

  async createJlptSection(examId: number, input: AdminJlptSectionInput, ownerId?: number) {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "JLPTSection" (
          exam_id, title, section_type, section_order, duration_minutes, audio_asset_id, audio_url, updated_at
        )
        SELECT $1, $2, $3, $4, $5, $6, $7, NOW()
        FROM "JLPTExam" e
        WHERE e.exam_id = $1
          AND e.deleted_at IS NULL
          ${ownerId ? "AND e.created_by = $8" : ""}
        RETURNING section_id, exam_id, title, section_type, section_order, duration_minutes,
                  audio_asset_id, audio_url, deleted_at, updated_at;
      `,
      [
        examId,
        input.title,
        input.section_type,
        input.section_order,
        input.duration_minutes ?? null,
        input.section_type === "listening" ? input.audio_asset_id ?? null : null,
        input.section_type === "listening" ? input.audio_url ?? null : null,
        ...(ownerId ? [ownerId] : []),
      ]
    );
    return result.rows[0] || null;
  }

  async updateJlptSection(sectionId: number, input: Partial<AdminJlptSectionInput>, ownerId?: number) {
    const fields = ["title", "section_type", "section_order", "duration_minutes", "audio_asset_id", "audio_url"] as const;
    const { updates, values } = buildUpdateSet(input, fields);

    if (!updates.length) return null;
    values.push(sectionId);
    if (ownerId) values.push(ownerId);
    const result = await databaseService.executeQuery(
      `
        UPDATE "JLPTSection" s
        SET ${updates.join(", ")}, updated_at = NOW()
        FROM "JLPTExam" e
        WHERE s.exam_id = e.exam_id
          AND s.section_id = $${ownerId ? values.length - 1 : values.length}
          AND s.deleted_at IS NULL
          AND e.deleted_at IS NULL
          ${ownerId ? `AND e.created_by = $${values.length}` : ""}
        RETURNING s.section_id, s.exam_id, s.title, s.section_type, s.section_order, s.duration_minutes,
                  s.audio_asset_id, s.audio_url, s.deleted_at, s.updated_at;
      `,
      values
    );
    return result.rows[0] || null;
  }

  async deleteJlptSection(sectionId: number, ownerId?: number): Promise<boolean> {
    return databaseService.withTransaction(async (client) => {
      const existing = await client.query(
        `
          SELECT s.section_id
          FROM "JLPTSection" s
          JOIN "JLPTExam" e ON e.exam_id = s.exam_id
          WHERE s.section_id = $1
            AND s.deleted_at IS NULL
            AND e.deleted_at IS NULL
            ${ownerId ? "AND e.created_by = $2" : ""};
        `,
        ownerId ? [sectionId, ownerId] : [sectionId]
      );
      if (!existing.rowCount) {
        return false;
      }

      await client.query(
        `
          UPDATE "JLPTSectionQuestion"
          SET deleted_at = COALESCE(deleted_at, NOW())
          WHERE section_id = $1
            AND deleted_at IS NULL;
        `,
        [sectionId]
      );
      await client.query(
        `
          UPDATE "JLPTSection"
          SET deleted_at = COALESCE(deleted_at, NOW()),
              updated_at = NOW()
          WHERE section_id = $1
            AND deleted_at IS NULL;
        `,
        [sectionId]
      );
      return true;
    });
  }
}

export default new AdminJlptSectionsModel();




