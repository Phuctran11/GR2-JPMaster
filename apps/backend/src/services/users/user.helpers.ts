import type { User } from "../../models/users/user.model.js";
import { ApiError } from "../../utils/http.js";

export type UserRole = "learner" | "owner" | "admin";

export const VALID_ROLES: UserRole[] = ["learner", "owner", "admin"];

const MAX_AVATAR_URL_LENGTH = 2000;

export const normalizeAvatarUrl = (value: unknown) => {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new ApiError(400, "avatar_url must be a string");
  }

  const avatarUrl = value.trim();
  if (!avatarUrl) return null;
  if (avatarUrl.length > MAX_AVATAR_URL_LENGTH) {
    throw new ApiError(400, "avatar_url is too long");
  }

  try {
    const parsed = new URL(avatarUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new ApiError(400, "avatar_url must be an HTTP or HTTPS URL");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "avatar_url must be a valid URL");
  }

  return avatarUrl;
};

export const toPublicUser = (user: User | null) => {
  if (!user) return null;
  const { password_hash: _passwordHash, ...userWithoutPassword } = user as User & { password_hash?: string };
  return userWithoutPassword;
};
