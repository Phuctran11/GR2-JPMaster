import databaseService from "../../services/database.service.js";

export class CourseEnrollmentProgressModel {
  async markLessonStarted(userId: number, courseId: number, lessonId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
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
      `,
      [userId, courseId, lessonId]
    );
    return result.rows.length > 0;
  }

  async markLessonCompleted(userId: number, lessonId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
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
      `,
      [userId, lessonId]
    );
    return result.rows.length > 0;
  }
}

export default new CourseEnrollmentProgressModel();

