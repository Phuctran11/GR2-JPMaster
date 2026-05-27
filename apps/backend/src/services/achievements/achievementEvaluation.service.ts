import databaseService from "../database.service.js";

class AchievementEvaluationService {
  async evaluateAchievements(userId: number, metadata: Record<string, unknown> = {}) {
    await databaseService.executeQuery(
      `
        WITH stats AS (
          SELECT
            (SELECT COUNT(*)::int FROM "UserLessonProgress" WHERE user_id = $1 AND completed = TRUE) AS completed_lessons,
            (SELECT COUNT(*)::int FROM "QuizAttempt" WHERE user_id = $1 AND quiz_id IS NOT NULL AND status IN ('submitted', 'graded')) AS completed_quizzes,
            (SELECT COUNT(*)::int FROM "QuizAttempt" WHERE user_id = $1 AND jlpt_exam_id IS NOT NULL AND status IN ('submitted', 'graded')) AS completed_jlpt_tests,
            (SELECT COALESCE(MAX(score), 0)::int FROM "QuizAttempt" WHERE user_id = $1 AND score IS NOT NULL) AS best_score,
            (
              SELECT COALESCE(SUM(COALESCE(NULLIF(l.duration, 0), 0)), 0)::int
              FROM "UserLessonProgress" ulp
              JOIN "Lesson" l ON l.lesson_id = ulp.lesson_id AND l.deleted_at IS NULL
              WHERE ulp.user_id = $1
                AND (ulp.completed = TRUE OR ulp.status = 'completed')
            ) AS total_study_minutes,
            (SELECT COUNT(DISTINCT progress_date)::int FROM "GoalProgress" WHERE user_id = $1 AND completed = TRUE) AS completed_goal_days
        )
        INSERT INTO "UserAchievement" (user_id, achievement_id, earned_at, metadata)
        SELECT $1, a.achievement_id, NOW(), $2::jsonb
        FROM "Achievement" a, stats s
        WHERE NOT EXISTS (
          SELECT 1 FROM "UserAchievement" ua
          WHERE ua.user_id = $1 AND ua.achievement_id = a.achievement_id
        )
        AND (
          (a.condition_key = 'completed_lessons' AND s.completed_lessons >= a.condition_value)
          OR (a.condition_key = 'completed_quizzes' AND s.completed_quizzes >= a.condition_value)
          OR (a.condition_key = 'completed_jlpt_tests' AND s.completed_jlpt_tests >= a.condition_value)
          OR (a.condition_key = 'score_at_least' AND s.best_score >= a.condition_value)
          OR (a.condition_key = 'total_study_minutes' AND s.total_study_minutes >= a.condition_value)
          OR (a.condition_key = 'completed_goal_days' AND s.completed_goal_days >= a.condition_value)
        );
      `,
      [userId, JSON.stringify(metadata)]
    );
  }
}

export default new AchievementEvaluationService();
