import type { PoolClient } from "pg";
import type { AdminJlptSectionInput, AdminListParams } from "../admin.model.js";
import { WhereBuilder } from "./adminModelHelpers.js";

export const buildJlptExamWhere = (params: AdminListParams) => {
  const where = new WhereBuilder([`e.deleted_at IS NULL`]);

  if (params.search?.trim()) {
    where.add(`e.title ILIKE ?`, `%${params.search.trim()}%`);
  }

  if (params.ownerId) {
    where.add(`e.created_by = ?`, params.ownerId);
  }

  return { values: where.values, whereSql: where.toSql() };
};

export const insertJlptExamSections = async (
  client: PoolClient,
  examId: number,
  sections: AdminJlptSectionInput[]
) => {
  if (sections.length === 0) return;

  await client.query(
    `
      INSERT INTO "JLPTSection" (
        exam_id, title, section_type, section_order, duration_minutes, audio_asset_id, audio_url, updated_at
      )
      SELECT $1, title, section_type, section_order, duration_minutes, audio_asset_id, audio_url, NOW()
      FROM UNNEST($2::text[], $3::text[], $4::int[], $5::int[], $6::int[], $7::text[])
        AS sections(title, section_type, section_order, duration_minutes, audio_asset_id, audio_url);
    `,
    [
      examId,
      sections.map((section) => section.title),
      sections.map((section) => section.section_type),
      sections.map((section) => section.section_order),
      sections.map((section) => section.duration_minutes ?? null),
      sections.map((section) => (section.section_type === "listening" ? section.audio_asset_id ?? null : null)),
      sections.map((section) => (section.section_type === "listening" ? section.audio_url ?? null : null)),
    ]
  );
};
