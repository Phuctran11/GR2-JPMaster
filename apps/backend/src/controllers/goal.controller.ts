import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import goalModel, { GoalPeriod, GoalType } from "../models/goal.model.js";

const GOAL_TYPES: GoalType[] = ["lessons_per_day", "quizzes_per_day", "study_minutes_per_day", "jlpt_tests_per_week"];
const GOAL_PERIODS: GoalPeriod[] = ["daily", "weekly", "monthly"];

export class GoalController {
  async listGoals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });
      return res.status(200).json({ data: await goalModel.listGoals(req.user.user_id) });
    } catch (error) {
      next(error);
    }
  }

  async listProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });
      return res.status(200).json({ data: await goalModel.listProgress(req.user.user_id, Number(req.query.days) || 30) });
    } catch (error) {
      next(error);
    }
  }

  async createGoal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });
      const goalType = req.body.goal_type as GoalType;
      const period = req.body.period as GoalPeriod;
      const targetValue = Number(req.body.target_value);
      if (!GOAL_TYPES.includes(goalType) || !GOAL_PERIODS.includes(period) || !Number.isFinite(targetValue) || targetValue <= 0) {
        return res.status(400).json({ error: "valid goal_type, period, and target_value are required" });
      }
      const data = await goalModel.createGoal(req.user.user_id, {
        goal_type: goalType,
        period,
        target_value: targetValue,
        start_date: req.body.start_date || null,
        end_date: req.body.end_date || null,
        is_active: req.body.is_active,
      });
      return res.status(201).json({ message: "Goal created successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async updateGoal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });
      const goalId = Number(req.params.id);
      if (!Number.isFinite(goalId)) return res.status(400).json({ error: "Invalid goal ID" });
      const data = await goalModel.updateGoal(req.user.user_id, goalId, {
        goal_type: req.body.goal_type,
        period: req.body.period,
        target_value: req.body.target_value === undefined ? undefined : Number(req.body.target_value),
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        is_active: req.body.is_active,
      });
      if (!data) return res.status(404).json({ error: "Goal not found or no changes provided" });
      return res.status(200).json({ message: "Goal updated successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async deleteGoal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });
      const goalId = Number(req.params.id);
      if (!Number.isFinite(goalId)) return res.status(400).json({ error: "Invalid goal ID" });
      const deleted = await goalModel.deleteGoal(req.user.user_id, goalId);
      if (!deleted) return res.status(404).json({ error: "Goal not found" });
      return res.status(200).json({ message: "Goal disabled successfully" });
    } catch (error) {
      next(error);
    }
  }
}

export default new GoalController();
