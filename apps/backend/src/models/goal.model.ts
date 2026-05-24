import databaseService from "../services/database.service.js";

export type GoalType = "lessons_per_day" | "quizzes_per_day" | "study_minutes_per_day" | "jlpt_tests_per_week";
export type GoalPeriod = "daily" | "weekly" | "monthly";

export interface GoalInput {
  goal_type: GoalType;
  target_value: number;
  period: GoalPeriod;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}

export class GoalModel {
  async listGoals(userId: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT g.goal_id, g.user_id, g.goal_type, g.target_value, g.period, g.start_date,
               g.end_date, g.is_active, g.created_at, g.updated_at,
               COALESCE(gp.actual_value, 0)::int AS current_value,
               COALESCE(gp.completed, FALSE) AS completed_today
        FROM "LearningGoal" g
        LEFT JOIN "GoalProgress" gp ON gp.goal_id = g.goal_id AND gp.progress_date = CURRENT_DATE
        WHERE g.user_id = $1
        ORDER BY g.is_active DESC, g.created_at DESC;
      `,
      [userId]
    );
    return result.rows;
  }

  async listProgress(userId: number, days = 30) {
    const result = await databaseService.executeQuery(
      `
        SELECT gp.progress_id, gp.goal_id, g.goal_type, gp.progress_date,
               gp.actual_value, gp.target_value, gp.completed
        FROM "GoalProgress" gp
        JOIN "LearningGoal" g ON g.goal_id = gp.goal_id
        WHERE gp.user_id = $1
          AND gp.progress_date >= CURRENT_DATE - ($2::int - 1)
        ORDER BY gp.progress_date DESC, gp.goal_id ASC;
      `,
      [userId, days]
    );
    return result.rows;
  }

  async createGoal(userId: number, input: GoalInput) {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "LearningGoal" (user_id, goal_type, target_value, period, start_date, end_date, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6::date, COALESCE($7, TRUE), NOW(), NOW())
        RETURNING goal_id, user_id, goal_type, target_value, period, start_date, end_date, is_active, created_at, updated_at;
      `,
      [userId, input.goal_type, input.target_value, input.period, input.start_date ?? null, input.end_date ?? null, input.is_active ?? true]
    );
    return result.rows[0];
  }

  async updateGoal(userId: number, goalId: number, input: Partial<GoalInput>) {
    const updates: string[] = [];
    const values: unknown[] = [];
    const fields = ["goal_type", "target_value", "period", "start_date", "end_date", "is_active"] as const;

    fields.forEach((field) => {
      if (input[field] !== undefined) {
        values.push(input[field]);
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (!updates.length) return null;
    values.push(goalId, userId);
    const result = await databaseService.executeQuery(
      `
        UPDATE "LearningGoal"
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE goal_id = $${values.length - 1}
          AND user_id = $${values.length}
        RETURNING goal_id, user_id, goal_type, target_value, period, start_date, end_date, is_active, created_at, updated_at;
      `,
      values
    );
    return result.rows[0] || null;
  }

  async deleteGoal(userId: number, goalId: number) {
    const result = await databaseService.executeQuery(
      `UPDATE "LearningGoal" SET is_active = FALSE, updated_at = NOW() WHERE goal_id = $1 AND user_id = $2;`,
      [goalId, userId]
    );
    return Boolean(result.rowCount);
  }
}

export default new GoalModel();
