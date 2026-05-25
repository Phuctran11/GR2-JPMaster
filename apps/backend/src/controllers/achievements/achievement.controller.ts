import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import achievementService from "../../services/achievements/achievement.service.js";
import { ok, requireUser } from "../../utils/http.js";

export class AchievementController {
  async listMine(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    return ok(res, await achievementService.listMine(user.user_id));
  }
}

export default new AchievementController();
