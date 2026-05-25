import userModel from "../../models/users/user.model.js";
import { ApiError } from "../../utils/http.js";
import { normalizeAvatarUrl, toPublicUser } from "./user.helpers.js";

class UserProfileService {
  async getMe(userId: number) {
    const user = await userModel.getUserById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return toPublicUser(user);
  }

  async updateMe(userId: number, input: { username?: unknown; email?: unknown; avatar_url?: unknown }) {
    const nextUsername = typeof input.username === "string" ? input.username.trim() : "";
    const nextEmail = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";

    if (!nextUsername || !nextEmail) {
      throw new ApiError(400, "username and email are required");
    }

    const existingEmailUser = await userModel.getUserByEmailIncludingDeleted(nextEmail);
    if (existingEmailUser && existingEmailUser.user_id !== userId) {
      throw new ApiError(409, "Email already exists");
    }

    const currentUser = await userModel.getUserById(userId);
    if (!currentUser) {
      throw new ApiError(404, "User not found");
    }

    const nextAvatarUrl = input.avatar_url === undefined ? currentUser.avatar_url : normalizeAvatarUrl(input.avatar_url);
    const updatedUser = await userModel.updateUserProfile(userId, nextUsername, nextEmail, nextAvatarUrl);
    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    return toPublicUser(updatedUser);
  }
}

export default new UserProfileService();
