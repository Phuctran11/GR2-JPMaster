import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import achievementModel from "../models/achievement.model.js";

export class AchievementController {
  async listMine(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });
      return res.status(200).json({ data: await achievementModel.listMine(req.user.user_id) });
    } catch (error) {
      next(error);
    }
  }
}

export default new AchievementController();
