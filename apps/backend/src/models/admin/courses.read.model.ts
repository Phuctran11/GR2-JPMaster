import databaseService from "../../services/database.service.js";
import type { AdminListParams } from "../admin.model.js";
import { orderDirection, withLimitOffset } from "./adminModelHelpers.js";
import { buildCourseWhere, formatAdminCourse } from "./courses.helpers.js";

export class AdminCoursesReadModel {
  async listCourses(params: AdminListParams) {
    const { limit, offset } = withLimitOffset(params);
    const direction = orderDirection(params);
    const { values, whereSql } = buildCourseWhere(params);

    values.push(limit, offset);
    const query = `
      SELECT c.course_id, c.title, c.description, c.price, c.level, c.duration, c.created_by,
             c.cover_asset_id, c.image_url, u.username AS creator_username, c.created_at, c.updated_at,
             COUNT(l.lesson_id)::int AS lesson_count
      FROM "Course" c
      LEFT JOIN "User" u ON u.user_id = c.created_by
      LEFT JOIN "Lesson" l ON l.course_id = c.course_id AND l.deleted_at IS NULL
      WHERE ${whereSql}
      GROUP BY c.course_id, u.username
      ORDER BY c.course_id ${direction}
      LIMIT $${values.length - 1} OFFSET $${values.length};
    `;
    const result = await databaseService.executeQuery(query, values);
    return result.rows.map(formatAdminCourse);
  }

  async countCourses(params: AdminListParams): Promise<number> {
    const { values, whereSql } = buildCourseWhere(params);
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(*)::int AS total_count
        FROM "Course" c
        WHERE ${whereSql};
      `,
      values
    );
    return Number(result.rows[0]?.total_count || 0);
  }
}

export default new AdminCoursesReadModel();
