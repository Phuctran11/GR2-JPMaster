import databaseService from "../../services/database.service.js";
import { activeCourseLessonExistsSql } from "../courses/courseVisibility.helpers.js";
import { formatEnrollment, type CourseEnrollment, type EnrollmentStatus } from "./enrollment.types.js";
import { clampEnrollmentLimit } from "./enrollmentRead.helpers.js";

export class EnrollmentListModel {
  async getEnrolledCourses(userId: number, limit = 10, offset = 0): Promise<CourseEnrollment[]> {
    const result = await databaseService.executeQuery(
      `
        SELECT ce.enrollment_id, ce.user_id, ce.course_id, ce.enrollment_date, ce.status
        FROM "CourseEnrollment" ce
        JOIN "Course" c ON c.course_id = ce.course_id
        WHERE ce.user_id = $1
          AND c.deleted_at IS NULL
          AND ${activeCourseLessonExistsSql("c")}
        ORDER BY ce.enrollment_date DESC
        LIMIT $2 OFFSET $3;
      `,
      [userId, clampEnrollmentLimit(limit), offset]
    );
    return result.rows.map(formatEnrollment);
  }

  async getEnrolledCoursesByStatus(
    userId: number,
    status: EnrollmentStatus,
    limit = 10,
    offset = 0
  ): Promise<CourseEnrollment[]> {
    const result = await databaseService.executeQuery(
      `
        SELECT ce.enrollment_id, ce.user_id, ce.course_id, ce.enrollment_date, ce.status
        FROM "CourseEnrollment" ce
        JOIN "Course" c ON c.course_id = ce.course_id
        WHERE ce.user_id = $1
          AND ce.status = $2
          AND c.deleted_at IS NULL
          AND ${activeCourseLessonExistsSql("c")}
        ORDER BY ce.enrollment_date DESC
        LIMIT $3 OFFSET $4;
      `,
      [userId, status, clampEnrollmentLimit(limit), offset]
    );
    return result.rows.map(formatEnrollment);
  }

  async getEnrolledCourseCountByStatus(userId: number, status: EnrollmentStatus): Promise<number> {
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(*)::int AS total_count
        FROM "CourseEnrollment" ce
        JOIN "Course" c ON c.course_id = ce.course_id
        WHERE ce.user_id = $1
          AND ce.status = $2
          AND c.deleted_at IS NULL
          AND ${activeCourseLessonExistsSql("c")};
      `,
      [userId, status]
    );
    return Number(result.rows[0]?.total_count || 0);
  }
}

export default new EnrollmentListModel();
