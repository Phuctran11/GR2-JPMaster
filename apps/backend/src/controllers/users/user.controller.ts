import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import userService from "../../services/users/user.service.js";
import { created, ok, requireUser } from "../../utils/http.js";

export class UserController {
  async googleLogin(req: Request, res: Response) {
    const result = await userService.googleLogin(req.body.token);
    return ok(res, result.data, { message: result.message, token: result.token });
  }

  async login(req: Request, res: Response) {
    const result = await userService.login(req.body.email, req.body.password);
    return ok(res, result.data, { message: result.message, token: result.token });
  }

  async createUser(req: Request, res: Response) {
    const user = await userService.createUser(req.body);
    return created(res, "User created successfully", user);
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const me = await userService.getMe(user.user_id);
    return ok(res, me);
  }

  async updateMe(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const updatedUser = await userService.updateMe(user.user_id, req.body);
    return ok(res, updatedUser, { message: "Profile updated successfully" });
  }
}

export default new UserController();
