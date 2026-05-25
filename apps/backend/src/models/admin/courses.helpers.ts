import type { AdminListParams } from "../admin.model.js";
import { WhereBuilder } from "./adminModelHelpers.js";

export type AdminCourseMutationInput = {
  title: string;
  description: string | null;
  price: number;
  level: string | null;
  duration: number | null;
  cover_asset_id: number | null;
  image_url: string | null;
};

export type AdminCourseCreateInput = AdminCourseMutationInput & {
  created_by: number;
};

export const courseMutationFields = [
  "title",
  "description",
  "price",
  "level",
  "duration",
  "cover_asset_id",
  "image_url",
] as const;

export const formatAdminCourse = (row: any) => ({ ...row, price: Number(row.price) });

export const buildCourseWhere = (params: AdminListParams) => {
  const where = new WhereBuilder([`c.deleted_at IS NULL`]);

  if (params.search?.trim()) {
    where.add(`(c.title ILIKE ? OR c.description ILIKE ?)`, `%${params.search.trim()}%`, `%${params.search.trim()}%`);
  }

  if (params.level?.trim()) {
    where.add(`c.level ILIKE ?`, `%${params.level.trim()}%`);
  }

  if (params.ownerId) {
    where.add(`c.created_by = ?`, params.ownerId);
  }

  return { values: where.values, whereSql: where.toSql() };
};
