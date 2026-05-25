import databaseService from "../../services/database.service.js";
import { courseAggregateSelectWithCreator, formatCourse, type Course } from "./course.types.js";
import { activeCourseLessonExistsSql } from "./courseVisibility.helpers.js";
import { orderByWhitelist, WhereBuilder } from "../sqlHelpers.js";

export class CourseExploreModel {
  async getExploreCourses({
    limit = 4,
    offset = 0,
    level = "all",
    sort = "newest",
  }: {
    limit?: number;
    offset?: number;
    level?: string;
    sort?: string;
  }): Promise<{ courses: Course[]; totalCount: number }> {
    const where = new WhereBuilder(["c.deleted_at IS NULL", activeCourseLessonExistsSql("c")]);

    if (level && level !== "all") {
      where.add("LOWER(COALESCE(c.level, '')) = ?", level.toLowerCase());
    }

    if (sort === "free") {
      where.addRaw("c.price = 0");
    }

    const whereSql = where.toSql();
    const orderSql = orderByWhitelist(
      sort,
      {
        "price-low": "c.price ASC, c.created_at DESC, c.course_id DESC",
        "price-high": "c.price DESC, c.created_at DESC, c.course_id DESC",
        free: "c.created_at DESC, c.course_id DESC",
        newest: "c.created_at DESC, c.course_id DESC",
      },
      "newest"
    );

    const countResult = await databaseService.executeQuery(
      `
        SELECT COUNT(*)::int AS total_count
        FROM "Course" c
        WHERE ${whereSql};
      `,
      where.values
    );
    const totalCount = Number(countResult.rows[0]?.total_count || 0);

    const params = [...where.values];
    params.push(limit, offset);
    const limitParam = params.length - 1;
    const offsetParam = params.length;
    const result = await databaseService.executeQuery(
      `
        SELECT ${courseAggregateSelectWithCreator}
        FROM "Course" c
        LEFT JOIN "User" u ON u.user_id = c.created_by
        LEFT JOIN "CourseEnrollment" e ON e.course_id = c.course_id
        LEFT JOIN "CourseRating" cr ON cr.course_id = c.course_id
        WHERE ${whereSql}
        GROUP BY c.course_id, u.username
        ORDER BY ${orderSql}
        LIMIT $${limitParam} OFFSET $${offsetParam};
      `,
      params
    );

    return {
      courses: result.rows.map(formatCourse),
      totalCount,
    };
  }
}

export default new CourseExploreModel();
