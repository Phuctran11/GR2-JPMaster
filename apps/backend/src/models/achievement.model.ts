import databaseService from "../services/database.service.js";

export class AchievementModel {
  async listAll(userId?: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT a.achievement_id, a.code, a.name, a.description, a.badge_icon,
               a.badge_color, a.achievement_type, a.tier, a.condition_key,
               a.condition_value, ua.earned_at,
               CASE
                 WHEN a.condition_key = 'completed_lessons' THEN (SELECT COUNT(*)::int FROM "UserLessonProgress" WHERE user_id = $1 AND completed = TRUE)
                 WHEN a.condition_key = 'completed_quizzes' THEN (SELECT COUNT(*)::int FROM "QuizAttempt" WHERE user_id = $1 AND quiz_id IS NOT NULL AND status IN ('submitted', 'graded'))
                 WHEN a.condition_key = 'completed_jlpt_tests' THEN (SELECT COUNT(*)::int FROM "QuizAttempt" WHERE user_id = $1 AND jlpt_exam_id IS NOT NULL AND status IN ('submitted', 'graded'))
                 WHEN a.condition_key = 'score_at_least' THEN (SELECT COALESCE(MAX(score), 0)::int FROM "QuizAttempt" WHERE user_id = $1 AND score IS NOT NULL)
                 WHEN a.condition_key = 'total_study_minutes' THEN (
                   SELECT COALESCE(SUM(COALESCE(NULLIF(l.duration, 0), 0)), 0)::int
                   FROM "UserLessonProgress" ulp
                   JOIN "Lesson" l ON l.lesson_id = ulp.lesson_id AND l.deleted_at IS NULL
                   WHERE ulp.user_id = $1
                     AND (ulp.completed = TRUE OR ulp.status = 'completed')
                 )
                 WHEN a.condition_key = 'completed_goal_days' THEN (SELECT COUNT(DISTINCT progress_date)::int FROM "GoalProgress" WHERE user_id = $1 AND completed = TRUE)
                 ELSE 0
               END AS current_value
        FROM "Achievement" a
        LEFT JOIN "UserAchievement" ua ON ua.achievement_id = a.achievement_id AND ua.user_id = $1
        ORDER BY
          CASE WHEN ua.earned_at IS NULL THEN 1 ELSE 0 END,
          a.achievement_type ASC,
          a.condition_key ASC,
          a.condition_value ASC,
          a.achievement_id ASC;
      `,
      [userId ?? 0]
    );
    return result.rows;
  }

  async listMine(userId: number) {
    return this.listAll(userId);
  }
}

export default new AchievementModel();
