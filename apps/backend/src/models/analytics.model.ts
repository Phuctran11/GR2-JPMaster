import databaseService from "../services/database.service.js";

export class AnalyticsModel {
  async getSummary(userId: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT
          (SELECT COUNT(*)::int FROM "CourseEnrollment" WHERE user_id = $1 AND status = 'active') AS active_courses,
          (SELECT COUNT(*)::int FROM "CourseEnrollment" WHERE user_id = $1 AND status = 'completed') AS completed_courses,
          (SELECT COUNT(*)::int FROM "UserLessonProgress" WHERE user_id = $1 AND completed = TRUE) AS completed_lessons,
          (SELECT COUNT(*)::int FROM "QuizAttempt" WHERE user_id = $1 AND quiz_id IS NOT NULL AND status IN ('submitted', 'graded')) AS quiz_attempts,
          (SELECT COUNT(*)::int FROM "QuizAttempt" WHERE user_id = $1 AND jlpt_exam_id IS NOT NULL AND status IN ('submitted', 'graded')) AS jlpt_attempts,
          (SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 0)::float FROM "QuizAttempt" WHERE user_id = $1 AND quiz_id IS NOT NULL AND score IS NOT NULL) AS average_quiz_score,
          (SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 0)::float FROM "QuizAttempt" WHERE user_id = $1 AND jlpt_exam_id IS NOT NULL AND score IS NOT NULL) AS average_jlpt_score,
          (
            SELECT COALESCE(SUM(COALESCE(NULLIF(l.duration, 0), 0) * 60), 0)::int
            FROM "UserLessonProgress" ulp
            JOIN "Lesson" l ON l.lesson_id = ulp.lesson_id AND l.deleted_at IS NULL
            WHERE ulp.user_id = $1
              AND (ulp.completed = TRUE OR ulp.status = 'completed')
          ) AS total_study_seconds,
          (
            SELECT COALESCE(SUM(COALESCE(NULLIF(l.duration, 0), 0) * 60), 0)::int
            FROM "UserLessonProgress" ulp
            JOIN "Lesson" l ON l.lesson_id = ulp.lesson_id AND l.deleted_at IS NULL
            WHERE ulp.user_id = $1
              AND (ulp.completed = TRUE OR ulp.status = 'completed')
              AND ulp.completed_at >= date_trunc('week', CURRENT_DATE)
              AND ulp.completed_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
          ) AS study_seconds_this_week,
          (
            SELECT COALESCE(SUM(COALESCE(NULLIF(l.duration, 0), 0) * 60), 0)::int
            FROM "UserLessonProgress" ulp
            JOIN "Lesson" l ON l.lesson_id = ulp.lesson_id AND l.deleted_at IS NULL
            WHERE ulp.user_id = $1
              AND (ulp.completed = TRUE OR ulp.status = 'completed')
              AND ulp.completed_at >= date_trunc('month', CURRENT_DATE)
              AND ulp.completed_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
          ) AS study_seconds_this_month;
      `,
      [userId]
    );
    return result.rows[0];
  }

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

  async getQuizPerformance(userId: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT qa.attempt_id, qa.quiz_id, q.title, q.quiz_type, qa.score, qa.total_marks,
               qa.status, qa.started_at, qa.submitted_at
        FROM "QuizAttempt" qa
        JOIN "Quiz" q ON q.quiz_id = qa.quiz_id
        WHERE qa.user_id = $1
          AND qa.quiz_id IS NOT NULL
          AND qa.status IN ('submitted', 'graded')
        ORDER BY qa.submitted_at DESC NULLS LAST, qa.attempt_id DESC
        LIMIT 20;
      `,
      [userId]
    );
    return result.rows.map((row) => ({ ...row, score: row.score == null ? null : Number(row.score), total_marks: row.total_marks == null ? null : Number(row.total_marks) }));
  }

  async getJlptPerformance(userId: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT qa.attempt_id, qa.jlpt_exam_id AS exam_id, e.title, e.jlpt_level,
               qa.score, qa.total_marks, qa.status, qa.started_at, qa.submitted_at
        FROM "QuizAttempt" qa
        JOIN "JLPTExam" e ON e.exam_id = qa.jlpt_exam_id
        WHERE qa.user_id = $1
          AND qa.jlpt_exam_id IS NOT NULL
          AND qa.status IN ('submitted', 'graded')
        ORDER BY qa.submitted_at DESC NULLS LAST, qa.attempt_id DESC
        LIMIT 20;
      `,
      [userId]
    );
    return result.rows.map((row) => ({ ...row, score: row.score == null ? null : Number(row.score), total_marks: row.total_marks == null ? null : Number(row.total_marks) }));
  }
}

export default new AnalyticsModel();
