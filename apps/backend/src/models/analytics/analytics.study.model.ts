import databaseService from "../../services/database.service.js";

export class AnalyticsStudyModel {
  async getStudyTime(userId: number, days = 30) {
    const result = await databaseService.executeQuery(
      `
        SELECT day::date AS study_date, COALESCE(SUM(COALESCE(NULLIF(l.duration, 0), 0) * 60), 0)::int AS duration_seconds
        FROM generate_series(CURRENT_DATE - ($2::int - 1), CURRENT_DATE, interval '1 day') AS day
        LEFT JOIN "UserLessonProgress" ulp
          ON ulp.user_id = $1
          AND (ulp.completed = TRUE OR ulp.status = 'completed')
          AND ulp.completed_at::date = day::date
        LEFT JOIN "Lesson" l ON l.lesson_id = ulp.lesson_id AND l.deleted_at IS NULL
        GROUP BY day
        ORDER BY day ASC;
      `,
      [userId, days]
    );
    return result.rows;
  }

  async getCourseProgress(userId: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT ce.enrollment_id, ce.course_id, c.title,
               ce.status, ce.enrollment_date,
               COUNT(l.lesson_id)::int AS total_lessons,
               COUNT(ulp.lesson_id) FILTER (WHERE ulp.completed = TRUE OR ulp.status = 'completed')::int AS completed_lessons,
               CASE
                 WHEN COUNT(l.lesson_id) = 0 THEN 0
                 ELSE ROUND((COUNT(ulp.lesson_id) FILTER (WHERE ulp.completed = TRUE OR ulp.status = 'completed')::numeric / COUNT(l.lesson_id)) * 100)::int
               END AS progress_percent
        FROM "CourseEnrollment" ce
        JOIN "Course" c ON c.course_id = ce.course_id AND c.deleted_at IS NULL
        LEFT JOIN "Lesson" l ON l.course_id = c.course_id AND l.deleted_at IS NULL
        LEFT JOIN "UserLessonProgress" ulp ON ulp.lesson_id = l.lesson_id AND ulp.user_id = ce.user_id
        WHERE ce.user_id = $1
        GROUP BY ce.enrollment_id, c.title
        ORDER BY ce.enrollment_date DESC;
      `,
      [userId]
    );
    return result.rows;
  }
}

export default new AnalyticsStudyModel();
