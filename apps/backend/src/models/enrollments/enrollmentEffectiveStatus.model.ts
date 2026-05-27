import databaseService from "../../services/database.service.js";
import { activeCourseLessonExistsSql } from "../courses/courseVisibility.helpers.js";
import { finalQuizExistsSql, finalQuizPassedSql, getEffectiveStatusCondition } from "./enrollment.statusSql.js";
import { formatEnrollment, type CourseEnrollment, type EnrollmentStatus } from "./enrollment.types.js";
import { clampEnrollmentLimit } from "./enrollmentRead.helpers.js";

export class EnrollmentEffectiveStatusModel {
  async getEnrolledCoursesByEffectiveStatus(
    userId: number,
    status: EnrollmentStatus,
    limit = 10,
    offset = 0
  ): Promise<CourseEnrollment[]> {
    const statusCondition = getEffectiveStatusCondition(status);
    const result = await databaseService.executeQuery(
      `
        SELECT ce.enrollment_id, ce.user_id, ce.course_id, ce.enrollment_date, ce.status
        FROM "CourseEnrollment" ce
        JOIN "Course" c ON c.course_id = ce.course_id
        WHERE ce.user_id = $1
          AND c.deleted_at IS NULL
          AND ${activeCourseLessonExistsSql("c")}
          AND ${statusCondition}
        ORDER BY ce.enrollment_date DESC
        LIMIT $2 OFFSET $3;
      `,
      [userId, clampEnrollmentLimit(limit), offset]
    );
    return result.rows.map(formatEnrollment);
  }

  async getEnrolledCourseCountByEffectiveStatus(userId: number, status: EnrollmentStatus): Promise<number> {
    const statusCondition = getEffectiveStatusCondition(status);
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(*)::int AS total_count
        FROM "CourseEnrollment" ce
        JOIN "Course" c ON c.course_id = ce.course_id
        WHERE ce.user_id = $1
          AND c.deleted_at IS NULL
          AND ${activeCourseLessonExistsSql("c")}
          AND ${statusCondition};
      `,
      [userId]
    );
    return Number(result.rows[0]?.total_count || 0);
  }

  async getEffectiveStatusesByCourseIds(userId: number, courseIds: number[]): Promise<Map<number, EnrollmentStatus>> {
    const uniqueCourseIds = Array.from(new Set(courseIds.filter(Number.isFinite)));
    if (uniqueCourseIds.length === 0) return new Map();

    const result = await databaseService.executeQuery(
      `
        SELECT
          ce.course_id,
          CASE
            WHEN ce.status <> 'completed' THEN ce.status
            WHEN NOT ${finalQuizExistsSql} OR ${finalQuizPassedSql} THEN 'completed'
            ELSE 'active'
          END AS effective_status
        FROM "CourseEnrollment" ce
        WHERE ce.user_id = $1
          AND ce.course_id = ANY($2::int[]);
      `,
      [userId, uniqueCourseIds]
    );

    return result.rows.reduce((map, row) => {
      map.set(Number(row.course_id), row.effective_status);
      return map;
    }, new Map<number, EnrollmentStatus>());
  }
}

export default new EnrollmentEffectiveStatusModel();
