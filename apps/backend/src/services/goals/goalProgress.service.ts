import databaseService from "../database.service.js";

export type GoalEventType = "lesson" | "quiz" | "jlpt_test" | "study_minutes";

const goalTypeByEvent: Record<GoalEventType, string> = {
  lesson: "lessons_per_day",
  quiz: "quizzes_per_day",
  jlpt_test: "jlpt_tests_per_week",
  study_minutes: "study_minutes_per_day",
};

class GoalProgressService {
  async incrementGoals(userId: number, eventType: GoalEventType, amount = 1) {
    const goalType = goalTypeByEvent[eventType];
    const useWeeklyProgressDate = eventType === "jlpt_test";

    await databaseService.executeQuery(
      `
        INSERT INTO "GoalProgress" (goal_id, user_id, progress_date, actual_value, target_value, completed, created_at, updated_at)
        SELECT
          goal_id,
          user_id,
          CASE WHEN $4::boolean THEN date_trunc('week', CURRENT_DATE)::date ELSE CURRENT_DATE END,
          $3::int,
          target_value,
          $3::int >= target_value,
          NOW(),
          NOW()
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
      [userId, goalType, amount, useWeeklyProgressDate]
    );
  }
}

export default new GoalProgressService();
