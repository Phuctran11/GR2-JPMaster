import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import goalService from "../../services/goals/goal.service.js";
import { created, message, ok, requireUser } from "../../utils/http.js";
import { parsePositiveInt } from "../../validators/common.validator.js";

export class GoalController {
  async listGoals(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    return ok(res, await goalService.listGoals(user.user_id));
  }

  async listProgress(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    return ok(res, await goalService.listProgress(user.user_id, req.query.days));
  }

  async createGoal(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const data = await goalService.createGoal(user.user_id, req.body);
    return created(res, "Goal created successfully", data);
  }

  async updateGoal(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const goalId = parsePositiveInt(req.params.id, "goal ID");
    const data = await goalService.updateGoal(user.user_id, goalId, req.body);
    return ok(res, data, { message: "Goal updated successfully" });
  }

  async deleteGoal(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const goalId = parsePositiveInt(req.params.id, "goal ID");
    await goalService.deleteGoal(user.user_id, goalId);
    return message(res, "Goal disabled successfully");
  }
}

export default new GoalController();
