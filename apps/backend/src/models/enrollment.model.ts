import databaseService from '../services/database.service.js';

/**
 * CourseEnrollment Interface
 * Represents a user's enrollment in a course (access tracking)
 */
export interface CourseEnrollment {
  enrollment_id: number;
  user_id: number;
  course_id: number;
  enrollment_date: Date;
  status: 'active' | 'completed' | 'dropped';
}

/**
 * Format database row to CourseEnrollment object
 */
const formatEnrollment = (row: any): CourseEnrollment => ({
  enrollment_id: row.enrollment_id,
  user_id: row.user_id,
  course_id: row.course_id,
  enrollment_date: row.enrollment_date,
  status: row.status,
});

/**
 * CourseEnrollmentModel
 * Handles course enrollment/access tracking
 * Separate from Purchase which handles payment transactions
 *
 * Responsibilities:
 * - Track who has access to which courses
 * - Manage enrollment lifecycle (active → completed/dropped)
 * - Verify user course access
 * - Support both free and paid course enrollments
 */
export class CourseEnrollmentModel {
  /**
   * Get all courses user is enrolled in
   * Returns paginated list ordered by most recent enrollment
   *
   * @param userId - User ID
   * @param limit - Number of records to return (default: 10, max: 100)
   * @param offset - Pagination offset (default: 0)
   * @returns Array of CourseEnrollment records
   * @throws Error if database query fails
   */
  async getEnrolledCourses(
    userId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<CourseEnrollment[]> {
    const limitSafe = Math.min(limit, 100);

    const query = `
      SELECT enrollment_id, user_id, course_id, enrollment_date, status
      FROM "CourseEnrollment"
      WHERE user_id = $1
      ORDER BY enrollment_date DESC
      LIMIT $2 OFFSET $3;
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId, limitSafe, offset]);
      return result.rows.map(formatEnrollment);
    } catch (error) {
      throw new Error(`Failed to fetch enrolled courses for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if user has access to a specific course
   * Quick check without returning full enrollment record
   *
   * @param userId - User ID
   * @param courseId - Course ID
   * @returns true if user is enrolled in course, false otherwise
   * @throws Error if database query fails
   */
  async checkUserCourseAccess(userId: number, courseId: number): Promise<boolean> {
    const query = `
      SELECT 1
      FROM "CourseEnrollment" ce
      JOIN "Course" c ON c.course_id = ce.course_id
      WHERE ce.user_id = $1
        AND ce.course_id = $2
        AND ce.status IN ('active', 'completed')
        AND c.deleted_at IS NULL
      LIMIT 1;
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId, courseId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(
        `Failed to check course access for user ${userId}, course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Enroll a user in a course
   * Creates a new enrollment record with 'active' status
   *
   * @param userId - User ID
   * @param courseId - Course ID
   * @param status - Initial enrollment status (default: 'active')
   * @returns Created CourseEnrollment record
   * @throws Error if enrollment already exists or database fails
   */
  async enrollUser(
    userId: number,
    courseId: number,
    status: 'active' | 'completed' | 'dropped' = 'active'
  ): Promise<CourseEnrollment> {
    const query = `
      INSERT INTO "CourseEnrollment" (user_id, course_id, enrollment_date, status)
      SELECT $1, c.course_id, NOW(), $3
      FROM "Course" c
      WHERE c.course_id = $2
        AND c.deleted_at IS NULL
      ON CONFLICT (user_id, course_id)
      DO UPDATE SET
        enrollment_date = NOW(),
        status = EXCLUDED.status
      RETURNING enrollment_id, user_id, course_id, enrollment_date, status;
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId, courseId, status]);

      if (!result.rows[0]) {
        throw new Error('Failed to create enrollment record');
      }

      return formatEnrollment(result.rows[0]);
    } catch (error) {
      throw new Error(
        `Failed to enroll user ${userId} in course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update enrollment status
   * Used to mark course as completed or dropped
   *
   * @param enrollmentId - Enrollment ID to update
   * @param status - New enrollment status
   * @returns Updated CourseEnrollment record, or null if not found
   * @throws Error if database fails
   */
  async updateEnrollmentStatus(
    enrollmentId: number,
    status: 'active' | 'completed' | 'dropped'
  ): Promise<CourseEnrollment | null> {
    const query = `
      UPDATE "CourseEnrollment"
      SET status = $1
      WHERE enrollment_id = $2
      RETURNING enrollment_id, user_id, course_id, enrollment_date, status;
    `;

    try {
      const result = await databaseService.executeQuery(query, [status, enrollmentId]);
      return result.rows[0] ? formatEnrollment(result.rows[0]) : null;
    } catch (error) {
      throw new Error(
        `Failed to update enrollment status for enrollment ${enrollmentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async updateEnrollmentStatusByUserAndCourse(
    userId: number,
    courseId: number,
    status: 'active' | 'completed' | 'dropped'
  ): Promise<CourseEnrollment | null> {
    const query = `
      UPDATE "CourseEnrollment"
      SET status = $1
      WHERE user_id = $2 AND course_id = $3
      RETURNING enrollment_id, user_id, course_id, enrollment_date, status;
    `;

    try {
      const result = await databaseService.executeQuery(query, [status, userId, courseId]);
      return result.rows[0] ? formatEnrollment(result.rows[0]) : null;
    } catch (error) {
      throw new Error(
        `Failed to update enrollment status for user ${userId}, course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get specific enrollment by ID
   *
   * @param enrollmentId - Enrollment ID
   * @returns CourseEnrollment record, or null if not found
   * @throws Error if database fails
   */
  async getEnrollmentById(enrollmentId: number): Promise<CourseEnrollment | null> {
    const query = `
      SELECT enrollment_id, user_id, course_id, enrollment_date, status
      FROM "CourseEnrollment"
      WHERE enrollment_id = $1;
    `;

    try {
      const result = await databaseService.executeQuery(query, [enrollmentId]);
      return result.rows[0] ? formatEnrollment(result.rows[0]) : null;
    } catch (error) {
      throw new Error(
        `Failed to fetch enrollment ${enrollmentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Drop enrollment record.
   * Keeps the row so CourseRating's composite foreign key remains valid.
   *
   * @param enrollmentId - Enrollment ID to delete
   * @returns true if deletion successful, false if enrollment not found
   * @throws Error if database fails
   */
  async deleteEnrollment(enrollmentId: number): Promise<boolean> {
    const query = `
      UPDATE "CourseEnrollment"
      SET status = 'dropped'
      WHERE enrollment_id = $1
      RETURNING enrollment_id;
    `;

    try {
      const result = await databaseService.executeQuery(query, [enrollmentId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      throw new Error(
        `Failed to delete enrollment ${enrollmentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get enrolled courses by status
   * Returns paginated list of enrollments filtered by status
   *
   * @param userId - User ID
   * @param status - Enrollment status ('active' | 'completed' | 'dropped')
   * @param limit - Number of records to return (default: 10, max: 100)
   * @param offset - Pagination offset (default: 0)
   * @returns Array of CourseEnrollment records with matching status
   * @throws Error if database query fails
   */
  async getEnrolledCoursesByStatus(
    userId: number,
    status: 'active' | 'completed' | 'dropped',
    limit: number = 10,
    offset: number = 0
  ): Promise<CourseEnrollment[]> {
    const limitSafe = Math.min(limit, 100);
    const validStatuses = ['active', 'completed', 'dropped'];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const query = `
      SELECT enrollment_id, user_id, course_id, enrollment_date, status
      FROM "CourseEnrollment"
      WHERE user_id = $1 AND status = $2
      ORDER BY enrollment_date DESC
      LIMIT $3 OFFSET $4;
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId, status, limitSafe, offset]);
      return result.rows.map(formatEnrollment);
    } catch (error) {
      throw new Error(
        `Failed to fetch enrolled courses by status for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get enrollment by user and course
   * Helper to find existing enrollment without needing enrollment_id
   *
   * @param userId - User ID
   * @param courseId - Course ID
   * @returns CourseEnrollment record, or null if not found
   * @throws Error if database fails
   */
  async getEnrollmentByUserAndCourse(userId: number, courseId: number): Promise<CourseEnrollment | null> {
    const query = `
      SELECT enrollment_id, user_id, course_id, enrollment_date, status
      FROM "CourseEnrollment"
      WHERE user_id = $1 AND course_id = $2;
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId, courseId]);
      return result.rows[0] ? formatEnrollment(result.rows[0]) : null;
    } catch (error) {
      throw new Error(
        `Failed to fetch enrollment for user ${userId}, course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Mark a lesson as started for a user.
   * Creates an in-progress row the first time a learner opens a lesson.
   */
  async markLessonStarted(userId: number, courseId: number, lessonId: number): Promise<boolean> {
    const query = `
      INSERT INTO "UserLessonProgress" (
        user_id,
        lesson_id,
        started_at,
        completed_at,
        video_watched_percent,
        completed,
        last_updated,
        status
      )
      SELECT $1, l.lesson_id, NOW(), NULL, 0, FALSE, NOW(), 'in_progress'
      FROM "Lesson" l
      JOIN "Course" c ON c.course_id = l.course_id
      WHERE l.lesson_id = $3
        AND l.course_id = $2
        AND l.deleted_at IS NULL
        AND c.deleted_at IS NULL
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET
        started_at = COALESCE("UserLessonProgress".started_at, NOW()),
        last_updated = NOW(),
        status = CASE
          WHEN "UserLessonProgress".completed = TRUE OR "UserLessonProgress".status = 'completed'
          THEN "UserLessonProgress".status
          ELSE 'in_progress'
        END
      RETURNING user_lesson_progress_id;
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId, courseId, lessonId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(
        `Failed to mark lesson ${lessonId} as started for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Mark a lesson as completed for a user
   * Creates or updates the lesson progress row for the given lesson
   */
  async markLessonCompleted(userId: number, lessonId: number): Promise<boolean> {
    const query = `
      INSERT INTO "UserLessonProgress" (
        user_id,
        lesson_id,
        started_at,
        completed_at,
        video_watched_percent,
        completed,
        last_updated,
        status
      )
      SELECT $1, l.lesson_id, NOW(), NOW(), 100, TRUE, NOW(), 'completed'
      FROM "Lesson" l
      JOIN "Course" c ON c.course_id = l.course_id
      WHERE l.lesson_id = $2
        AND l.deleted_at IS NULL
        AND c.deleted_at IS NULL
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET
        completed = TRUE,
        completed_at = COALESCE("UserLessonProgress".completed_at, NOW()),
        video_watched_percent = 100,
        last_updated = NOW(),
        status = 'completed'
      RETURNING user_lesson_progress_id;
    `;

    try {
      const result = await databaseService.executeQuery(query, [userId, lessonId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(
        `Failed to mark lesson ${lessonId} as completed for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export default new CourseEnrollmentModel();
