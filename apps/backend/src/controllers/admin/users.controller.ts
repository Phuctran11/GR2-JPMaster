import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import adminUsersService from "../../services/admin/users.service.js";
import { created, message, ok, paginated, requireUser } from "../../utils/http.js";
import { parsePositiveInt } from "../../validators/common.validator.js";

export class AdminUsersController {
  async listUsers(req: Request, res: Response) {
    adminUsersService.requireAdmin((req as AuthenticatedRequest).user?.role);
    const { data, totalCount } = await adminUsersService.listUsers(req.query);
    return paginated(res, data, totalCount);
  }

  async createUser(req: Request, res: Response) {
    adminUsersService.requireAdmin((req as AuthenticatedRequest).user?.role);
    const user = await adminUsersService.createUser(req.body);
    return created(res, "User created successfully", user);
  }

  async updateUser(req: Request, res: Response) {
    adminUsersService.requireAdmin((req as AuthenticatedRequest).user?.role);
    const userId = parsePositiveInt(req.params.id, "user ID");
    const updated = await adminUsersService.updateUser(userId, req.body);
    return ok(res, updated, { message: "User updated successfully" });
  }

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    adminUsersService.requireAdmin(user.role);
    const userId = parsePositiveInt(req.params.id, "user ID");
    await adminUsersService.deleteUser(user.user_id, userId);
    return message(res, "User deleted successfully");
  }
}

export default new AdminUsersController();
