import databaseService from "../../services/database.service.js";
import { formatEnrollment, type CourseEnrollment } from "./enrollment.types.js";

export class EnrollmentLookupModel {
  async checkUserCourseAccess(userId: number, courseId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        SELECT 1
        FROM "CourseEnrollment" ce
        JOIN "Course" c ON c.course_id = ce.course_id
        WHERE ce.user_id = $1
          AND ce.course_id = $2
          AND ce.status IN ('active', 'completed')
          AND c.deleted_at IS NULL
        LIMIT 1;
      `,
      [userId, courseId]
    );
    return result.rows.length > 0;
  }

  async getEnrollmentById(enrollmentId: number): Promise<CourseEnrollment | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT enrollment_id, user_id, course_id, enrollment_date, status
        FROM "CourseEnrollment"
        WHERE enrollment_id = $1;
      `,
      [enrollmentId]
    );
    return result.rows[0] ? formatEnrollment(result.rows[0]) : null;
  }

  async getEnrollmentByUserAndCourse(userId: number, courseId: number): Promise<CourseEnrollment | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT enrollment_id, user_id, course_id, enrollment_date, status
        FROM "CourseEnrollment"
        WHERE user_id = $1 AND course_id = $2;
      `,
      [userId, courseId]
    );
    return result.rows[0] ? formatEnrollment(result.rows[0]) : null;
  }
}

export default new EnrollmentLookupModel();
