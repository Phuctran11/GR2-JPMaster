import { USER_ROLES, USER_STATUSES } from "../../constants/admin.constants.js";
import { UserRole, UserStatus } from "../../models/admin.model.js";
import adminUsersModel from "../../models/admin/users.model.js";
import userModel, { User } from "../../models/users/user.model.js";
import { ApiError } from "../../utils/http.js";
import { BodyInput, parseAdminPagination, parseSortOrder, QueryInput, requireString } from "../../validators/admin/common.validator.js";
import passwordService from "../users/password.service.js";
import { toPublicUser } from "../users/user.helpers.js";

export class AdminUsersService {
  requireAdmin(role?: string) {
    if (role !== "admin") {
      throw new ApiError(403, "Admin access is required");
    }
  }

  async listUsers(query: QueryInput) {
    const { limit, offset } = parseAdminPagination(query);
    const params = {
      limit,
      offset,
      search: String(query.search || ""),
      role: (query.role as UserRole | "all") || "all",
      sortOrder: parseSortOrder(query.sort_order),
    };
    const [data, totalCount] = await Promise.all([
      adminUsersModel.listUsers(params),
      adminUsersModel.countUsers(params),
    ]);

    return { data, totalCount };
  }

  async createUser(body: BodyInput) {
    const username = requireString(body.username);
    const email = requireString(body.email).toLowerCase();
    const password = requireString(body.password);
    const role = body.role as UserRole;

    if (!username || !email || !password) {
      throw new ApiError(400, "username, email, and password are required");
    }

    if (!USER_ROLES.includes(role)) {
      throw new ApiError(400, "Invalid role");
    }

    const existing = await userModel.getUserByEmailIncludingDeleted(email);
    if (existing) {
      throw new ApiError(409, "Email already exists");
    }

    const user = await userModel.createUser(username, email, await passwordService.hashPassword(password), role);
    return toPublicUser(user);
  }

  async updateUser(userId: number, body: BodyInput) {
    const username = requireString(body.username);
    const email = requireString(body.email).toLowerCase();
    const role = body.role as UserRole;
    const status = body.status as UserStatus;

    if (!username || !email || !USER_ROLES.includes(role) || !USER_STATUSES.includes(status)) {
      throw new ApiError(400, "username, email, valid role, and valid status are required");
    }

    const existingEmailUser = await userModel.getUserByEmailIncludingDeleted(email);
    if (existingEmailUser && existingEmailUser.user_id !== userId) {
      throw new ApiError(409, "Email already exists");
    }

    const updated = await userModel.updateUser(userId, username, email, role, status as "active" | "suspended");
    if (!updated) {
      throw new ApiError(404, "User not found");
    }

    return toPublicUser(updated);
  }

  async deleteUser(currentUserId: number, userId: number) {
    if (currentUserId === userId) {
      throw new ApiError(400, "You cannot delete your own admin account");
    }

    const deleted = await adminUsersModel.softDeleteUser(userId);
    if (!deleted) {
      throw new ApiError(404, "User not found");
    }
  }
}

export default new AdminUsersService();
