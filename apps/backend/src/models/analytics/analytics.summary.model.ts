import databaseService from "../../services/database.service.js";

export class AnalyticsSummaryModel {
  async getSummary(userId: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT
          (
            SELECT COUNT(*)::int
            FROM "CourseEnrollment" ce
            JOIN "Course" c ON c.course_id = ce.course_id AND c.deleted_at IS NULL
            LEFT JOIN LATERAL (
              SELECT q.quiz_id
              FROM "Quiz" q
              WHERE q.course_id = ce.course_id
                AND q.quiz_type = 'final_test'
                AND q.deleted_at IS NULL
              ORDER BY q.quiz_id DESC
              LIMIT 1
            ) fq ON TRUE
            WHERE ce.user_id = $1
              AND (
                ce.status = 'active'
                OR (
                  ce.status = 'completed'
                  AND fq.quiz_id IS NOT NULL
                  AND NOT EXISTS (
                    SELECT 1
                    FROM "QuizAttempt" qa
                    JOIN "Quiz" q ON q.quiz_id = qa.quiz_id
                    WHERE qa.user_id = ce.user_id
                      AND qa.quiz_id = fq.quiz_id
                      AND q.deleted_at IS NULL
                      AND qa.status IN ('submitted', 'graded')
                      AND qa.score >= q.passing_score
                  )
                )
              )
          ) AS active_courses,
          (
            SELECT COUNT(*)::int
            FROM "CourseEnrollment" ce
            JOIN "Course" c ON c.course_id = ce.course_id AND c.deleted_at IS NULL
            LEFT JOIN LATERAL (
              SELECT q.quiz_id
              FROM "Quiz" q
              WHERE q.course_id = ce.course_id
                AND q.quiz_type = 'final_test'
                AND q.deleted_at IS NULL
              ORDER BY q.quiz_id DESC
              LIMIT 1
            ) fq ON TRUE
            WHERE ce.user_id = $1
              AND ce.status = 'completed'
              AND (
                fq.quiz_id IS NULL
                OR EXISTS (
                  SELECT 1
                  FROM "QuizAttempt" qa
                  JOIN "Quiz" q ON q.quiz_id = qa.quiz_id
                  WHERE qa.user_id = ce.user_id
                    AND qa.quiz_id = fq.quiz_id
                    AND q.deleted_at IS NULL
                    AND qa.status IN ('submitted', 'graded')
                    AND qa.score >= q.passing_score
                )
              )
          ) AS completed_courses,
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
}

export default new AnalyticsSummaryModel();
