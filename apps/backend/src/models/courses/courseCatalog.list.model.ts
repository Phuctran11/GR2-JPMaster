import databaseService from "../../services/database.service.js";
import {
  courseAggregateSelectWithCreator,
  courseBaseSelectWithCreator,
  formatCourse,
  type Course,
} from "./course.types.js";
import { activeCourseLessonExistsSql } from "./courseVisibility.helpers.js";

export class CourseCatalogListModel {
  async getAllCourses(limit = 10, offset = 0): Promise<Course[]> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${courseAggregateSelectWithCreator}
        FROM "Course" c
        LEFT JOIN "User" u ON u.user_id = c.created_by
        LEFT JOIN "CourseEnrollment" e ON e.course_id = c.course_id
        LEFT JOIN "CourseRating" cr ON cr.course_id = c.course_id
        WHERE c.deleted_at IS NULL
          AND ${activeCourseLessonExistsSql("c")}
        GROUP BY c.course_id, u.username
        ORDER BY c.created_at DESC
        LIMIT $1 OFFSET $2;
      `,
      [limit, offset]
    );
    return result.rows.map(formatCourse);
  }

  async getPopularCourses(limit = 4): Promise<Course[]> {
    const result = await databaseService.executeQuery(
      `
        SELECT
          ${courseBaseSelectWithCreator},
          COUNT(DISTINCT e.enrollment_id) AS enroll_count,
          AVG(cr.rating) AS average_rating,
          COUNT(DISTINCT cr.rating_id) AS rating_count
        FROM "Course" c
        LEFT JOIN "User" u ON u.user_id = c.created_by
        LEFT JOIN "CourseEnrollment" e ON e.course_id = c.course_id
        LEFT JOIN "CourseRating" cr ON cr.course_id = c.course_id
        WHERE c.deleted_at IS NULL
          AND ${activeCourseLessonExistsSql("c")}
        GROUP BY c.course_id, u.username
        ORDER BY enroll_count DESC, c.created_at DESC
        LIMIT $1;
      `,
      [limit]
    );
    return result.rows.map(formatCourse);
  }
}

export default new CourseCatalogListModel();
