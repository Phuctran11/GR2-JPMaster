import databaseService from "../../services/database.service.js";
import type { AdminListParams } from "../admin.model.js";
import { orderDirection, withLimitOffset } from "./adminModelHelpers.js";
import { buildQuizWhere } from "./quizzes.helpers.js";

class AdminQuizzesReadModel {
  async listQuizzes(params: AdminListParams) {
    const { limit, offset } = withLimitOffset(params);
    const direction = orderDirection(params);
    const { values, whereSql } = buildQuizWhere(params);

    values.push(limit, offset);
    const result = await databaseService.executeQuery(
      `
        SELECT q.quiz_id, q.lesson_id, q.course_id, COALESCE(c.title, lc.title) AS course_title,
               q.title, q.description, q.quiz_type, q.passing_score, q.total_marks,
               q.time_limit_minutes, q.created_by, q.created_at, q.updated_at,
               COUNT(qq.quiz_question_id)::int AS question_count
        FROM "Quiz" q
        LEFT JOIN "Course" c ON c.course_id = q.course_id AND c.deleted_at IS NULL
        LEFT JOIN "Lesson" l ON l.lesson_id = q.lesson_id AND l.deleted_at IS NULL
        LEFT JOIN "Course" lc ON lc.course_id = l.course_id AND lc.deleted_at IS NULL
        LEFT JOIN "QuizQuestion" qq ON qq.quiz_id = q.quiz_id AND qq.deleted_at IS NULL
        WHERE ${whereSql}
        GROUP BY q.quiz_id, c.title, lc.title
        ORDER BY q.quiz_id ${direction}
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );
    return result.rows.map((row) => ({
      ...row,
      passing_score: Number(row.passing_score),
      total_marks: Number(row.total_marks),
    }));
  }

  async countQuizzes(params: AdminListParams): Promise<number> {
    const { values, whereSql } = buildQuizWhere(params);
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(*)::int AS total_count
        FROM "Quiz" q
        WHERE ${whereSql};
      `,
      values
    );
    return Number(result.rows[0]?.total_count || 0);
  }
}

export default new AdminQuizzesReadModel();
