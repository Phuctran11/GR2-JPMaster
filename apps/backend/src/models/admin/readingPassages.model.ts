import databaseService from "../../services/database.service.js";
import { AdminReadingPassageInput, JlptLevel } from "../admin.model.js";
import { buildUpdateSet, WhereBuilder } from "./adminModelHelpers.js";

class AdminReadingPassagesModel {
  async listReadingPassages(params: { jlptLevel?: JlptLevel; ownerId?: number }) {
    const where = new WhereBuilder([`deleted_at IS NULL`]);

    if (params.jlptLevel) {
      where.add(`jlpt_level = ?`, params.jlptLevel);
    }

    if (params.ownerId) {
      where.add(`created_by = ?`, params.ownerId);
    }

    const result = await databaseService.executeQuery(
      `
        SELECT passage_id, title, jlpt_level, passage_text, image_asset_id, image_url, created_by, created_at, updated_at
        FROM "ReadingPassage"
        WHERE ${where.toSql()}
        ORDER BY updated_at DESC, passage_id DESC;
      `,
      where.values
    );
    return result.rows;
  }

  async createReadingPassage(input: AdminReadingPassageInput & { created_by: number }) {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "ReadingPassage" (title, jlpt_level, passage_text, image_asset_id, image_url, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING passage_id, title, jlpt_level, passage_text, image_asset_id, image_url, created_by, created_at, updated_at;
      `,
      [input.title, input.jlpt_level, input.passage_text, input.image_asset_id ?? null, input.image_url ?? null, input.created_by]
    );
    return result.rows[0];
  }

  async updateReadingPassage(passageId: number, input: Partial<AdminReadingPassageInput>, ownerId?: number) {
    const fields = ["title", "jlpt_level", "passage_text", "image_asset_id", "image_url"] as const;
    const { updates, values } = buildUpdateSet(input, fields);

    if (!updates.length) return null;
    values.push(passageId);
    if (ownerId) values.push(ownerId);

    const result = await databaseService.executeQuery(
      `
        UPDATE "ReadingPassage"
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE passage_id = $${ownerId ? values.length - 1 : values.length}
          AND deleted_at IS NULL
          ${ownerId ? `AND created_by = $${values.length}` : ""}
        RETURNING passage_id, title, jlpt_level, passage_text, image_asset_id, image_url, created_by, created_at, updated_at;
      `,
      values
    );
    return result.rows[0] || null;
  }

  async deleteReadingPassage(passageId: number, ownerId?: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "ReadingPassage"
        SET deleted_at = COALESCE(deleted_at, NOW()), updated_at = NOW()
        WHERE passage_id = $1
          AND deleted_at IS NULL
          ${ownerId ? "AND created_by = $2" : ""};
      `,
      ownerId ? [passageId, ownerId] : [passageId]
    );
    return Boolean(result.rowCount);
  }
}

export default new AdminReadingPassagesModel();



