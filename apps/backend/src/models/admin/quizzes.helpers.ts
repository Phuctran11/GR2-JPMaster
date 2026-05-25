import type { AdminListParams } from "../admin.model.js";
import { WhereBuilder } from "./adminModelHelpers.js";

export const buildQuizWhere = (params: AdminListParams) => {
  const where = new WhereBuilder([`q.deleted_at IS NULL`]);

  if (params.search?.trim()) {
    where.add(`(q.title ILIKE ? OR q.description ILIKE ?)`, `%${params.search.trim()}%`, `%${params.search.trim()}%`);
  }

  if (params.quizType && params.quizType !== "all") {
    where.add(`q.quiz_type = ?`, params.quizType);
  }

  if (params.ownerId) {
    where.add(`q.created_by = ?`, params.ownerId);
  }

  return { values: where.values, whereSql: where.toSql() };
};
