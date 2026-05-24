import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import analyticsModel from "../models/analytics.model.js";

const parseDays = (range: unknown) => {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  return 30;
};

export class AnalyticsController {
  async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });
      return res.status(200).json({ data: await analyticsModel.getSummary(req.user.user_id) });
    } catch (error) {
      next(error);
    }
  }

  async getStudyTime(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });
      return res.status(200).json({ data: await analyticsModel.getStudyTime(req.user.user_id, parseDays(req.query.range)) });
    } catch (error) {
      next(error);
    }
  }

  async getCourseProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });
      return res.status(200).json({ data: await analyticsModel.getCourseProgress(req.user.user_id) });
    } catch (error) {
      next(error);
    }
  }

  async getQuizPerformance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });
      return res.status(200).json({ data: await analyticsModel.getQuizPerformance(req.user.user_id) });
    } catch (error) {
      next(error);
    }
  }

  async getJlptPerformance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });
      return res.status(200).json({ data: await analyticsModel.getJlptPerformance(req.user.user_id) });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();
