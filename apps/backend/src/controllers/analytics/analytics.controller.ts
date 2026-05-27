import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import analyticsModel from "../../models/analytics/analytics.model.js";
import { ok, requireUser } from "../../utils/http.js";

const parseDays = (range: unknown) => {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  return 30;
};

export class AnalyticsController {
  async getSummary(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    return ok(res, await analyticsModel.getSummary(user.user_id));
  }

  async getStudyTime(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    return ok(res, await analyticsModel.getStudyTime(user.user_id, parseDays(req.query.range)));
  }

  async getCourseProgress(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    return ok(res, await analyticsModel.getCourseProgress(user.user_id));
  }

  async getQuizPerformance(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    return ok(res, await analyticsModel.getQuizPerformance(user.user_id));
  }

  async getJlptPerformance(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    return ok(res, await analyticsModel.getJlptPerformance(user.user_id));
  }
}

export default new AnalyticsController();
