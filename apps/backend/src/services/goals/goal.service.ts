import goalModel, { GoalPeriod, GoalType } from "../../models/goals/goal.model.js";
import { ApiError } from "../../utils/http.js";
import { BodyInput, optionalStringOrNull } from "../../validators/common.validator.js";

const GOAL_TYPES: GoalType[] = ["lessons_per_day", "quizzes_per_day", "study_minutes_per_day", "jlpt_tests_per_week"];
const GOAL_PERIODS: GoalPeriod[] = ["daily", "weekly", "monthly"];

export class GoalService {
  async listGoals(userId: number) {
    return goalModel.listGoals(userId);
  }

  async listProgress(userId: number, days: unknown) {
    return goalModel.listProgress(userId, Number(days) || 30);
  }

  async createGoal(userId: number, body: BodyInput) {
    const goalType = body.goal_type as GoalType;
    const period = body.period as GoalPeriod;
    const targetValue = Number(body.target_value);

    if (!GOAL_TYPES.includes(goalType) || !GOAL_PERIODS.includes(period) || !Number.isFinite(targetValue) || targetValue <= 0) {
      throw new ApiError(400, "valid goal_type, period, and target_value are required");
    }

    return goalModel.createGoal(userId, {
      goal_type: goalType,
      period,
      target_value: targetValue,
      start_date: optionalStringOrNull(body.start_date),
      end_date: optionalStringOrNull(body.end_date),
      is_active: typeof body.is_active === "boolean" ? body.is_active : undefined,
    });
  }

  async updateGoal(userId: number, goalId: number, body: BodyInput) {
    const goal = await goalModel.updateGoal(userId, goalId, {
      goal_type: body.goal_type as GoalType | undefined,
      period: body.period as GoalPeriod | undefined,
      target_value: body.target_value === undefined ? undefined : Number(body.target_value),
      start_date: body.start_date === undefined ? undefined : optionalStringOrNull(body.start_date),
      end_date: body.end_date === undefined ? undefined : optionalStringOrNull(body.end_date),
      is_active: typeof body.is_active === "boolean" ? body.is_active : undefined,
    });

    if (!goal) {
      throw new ApiError(404, "Goal not found or no changes provided");
    }

    return goal;
  }

  async deleteGoal(userId: number, goalId: number) {
    const deleted = await goalModel.deleteGoal(userId, goalId);
    if (!deleted) {
      throw new ApiError(404, "Goal not found");
    }
  }
}

export default new GoalService();
