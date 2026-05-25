import { Request, Response } from "express";
import adminStatsService from "../../services/admin/stats.service.js";
import { ownerScope } from "../../utils/adminContext.js";
import { ok } from "../../utils/http.js";

export class AdminStatsController {
  async getStats(req: Request, res: Response) {
    const stats = await adminStatsService.getStats(ownerScope(req));
    return ok(res, stats);
  }
}

export default new AdminStatsController();
