import databaseService from "./database.service.js";

type GoalEventType = "lesson" | "quiz" | "jlpt_test" | "study_minutes";

const goalTypeByEvent: Record<GoalEventType, string> = {
  lesson: "lessons_per_day",
  quiz: "quizzes_per_day",
  jlpt_test: "jlpt_tests_per_week",
  study_minutes: "study_minutes_per_day",
};

export class LearningActivityService {
  private async getLessonDurationSeconds(lessonId: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT
          COALESCE(
            NULLIF(l.duration, 0) * 60,
            ROUND(ca.duration_seconds)::int,
            ROUND(audio.duration_seconds)::int,
            0
          ) AS duration_seconds
        FROM "Lesson" l
        LEFT JOIN "CloudinaryAsset" ca ON ca.asset_id = l.video_asset_id
        LEFT JOIN "CloudinaryAsset" audio ON audio.asset_id = l.audio_asset_id
        WHERE l.lesson_id = $1
        LIMIT 1;
      `,
      [lessonId]
    );
    return Number(result.rows[0]?.duration_seconds ?? 0);
  }

  async recordStudySession(input: {
    userId: number;
    activityType: "lesson" | "quiz" | "jlpt_test" | "flashcard" | "review";
    courseId?: number | null;
    lessonId?: number | null;
    quizId?: number | null;
    jlptExamId?: number | null;
    durationSeconds?: number;
  }) {
    await databaseService.executeQuery(
      `
        INSERT INTO "StudySession" (
          user_id, course_id, lesson_id, quiz_id, jlpt_exam_id,
          activity_type, started_at, ended_at, duration_seconds, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW() - ($7::int * interval '1 second'), NOW(), $7, NOW());
      `,
      [
        input.userId,
        input.courseId ?? null,
        input.lessonId ?? null,
        input.quizId ?? null,
        input.jlptExamId ?? null,
        input.activityType,
        input.durationSeconds ?? 0,
      ]
    );
  }

  async incrementGoals(userId: number, eventType: GoalEventType, amount = 1) {
    const goalType = goalTypeByEvent[eventType];
    const progressDateExpression = eventType === "jlpt_test" ? "date_trunc('week', CURRENT_DATE)::date" : "CURRENT_DATE";

    await databaseService.executeQuery(
      `
        INSERT INTO "GoalProgress" (goal_id, user_id, progress_date, actual_value, target_value, completed, created_at, updated_at)
        SELECT goal_id, user_id, ${progressDateExpression}, $3::int, target_value, $3::int >= target_value, NOW(), NOW()
        FROM "LearningGoal"
        WHERE user_id = $1
          AND goal_type = $2
          AND is_active = TRUE
          AND start_date <= CURRENT_DATE
          AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        ON CONFLICT (goal_id, progress_date)
        DO UPDATE SET
          actual_value = "GoalProgress".actual_value + EXCLUDED.actual_value,
          completed = ("GoalProgress".actual_value + EXCLUDED.actual_value) >= "GoalProgress".target_value,
          updated_at = NOW();
      `,
      [userId, goalType, amount]
    );
  }

  async recordLessonCompleted(userId: number, courseId: number, lessonId: number, durationSeconds?: number) {
    const resolvedDurationSeconds = durationSeconds ?? await this.getLessonDurationSeconds(lessonId);
    await this.incrementGoals(userId, "lesson", 1);
    if (resolvedDurationSeconds > 0) await this.incrementGoals(userId, "study_minutes", Math.ceil(resolvedDurationSeconds / 60));
    await this.evaluateAchievements(userId);
  }

  async recordQuizSubmitted(userId: number, quizId: number, score: number) {
    await this.incrementGoals(userId, "quiz", 1);
    await this.evaluateAchievements(userId, { latest_score: score });
  }

  async recordJlptSubmitted(userId: number, examId: number, score: number) {
    await this.incrementGoals(userId, "jlpt_test", 1);
    await this.evaluateAchievements(userId, { latest_score: score });
  }

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

export default new LearningActivityService();
