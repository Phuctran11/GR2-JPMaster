import type { AdminListParams } from "../admin.model.js";
import { WhereBuilder } from "./adminModelHelpers.js";

export type AdminLessonMutationInput = {
  title: string;
  content_text: string | null;
  video_asset_id: number | null;
  video_url: string | null;
  audio_asset_id: number | null;
  audio_url: string | null;
  order_index: number;
  duration: number | null;
};

export type AdminLessonCreateInput = AdminLessonMutationInput & {
  course_id: number;
  owner_id?: number;
};

export const lessonMutationFields = [
  "title",
  "content_text",
  "video_asset_id",
  "video_url",
  "audio_asset_id",
  "audio_url",
  "order_index",
  "duration",
] as const;

export const buildLessonWhere = (params: AdminListParams) => {
  const where = new WhereBuilder([`l.deleted_at IS NULL`, `c.deleted_at IS NULL`]);

  if (params.search?.trim()) {
    where.add(`(l.title ILIKE ? OR l.content_text ILIKE ?)`, `%${params.search.trim()}%`, `%${params.search.trim()}%`);
  }

  if (params.courseId) {
    where.add(`l.course_id = ?`, params.courseId);
  }

  if (params.ownerId) {
    where.add(`c.created_by = ?`, params.ownerId);
  }

  return { values: where.values, whereSql: where.toSql() };
};
