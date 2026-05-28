import axios from "axios";
import userModel, { type UserWithPassword } from "../../models/users/user.model.js";
import { ApiError } from "../../utils/http.js";
import passwordService from "./password.service.js";
import tokenService from "./token.service.js";
import { normalizeAvatarUrl, toPublicUser } from "./user.helpers.js";

interface GoogleTokenInfo {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  iss?: string;
  name?: string;
  picture?: string;
  sub?: string;
}

const getGoogleClientIds = () =>
  [process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_IDS, process.env.VITE_GOOGLE_CLIENT_ID]
    .flatMap((value) => (value ?? "").split(","))
    .map((value) => value.trim())
    .filter(Boolean);

const normalizeUsernameCandidate = (value: string) => {
  const normalized = value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}_. -]/gu, "")
    .slice(0, 60);

  return normalized || "google_user";
};

class UserAuthService {
  private generateAuthResponse(message: string, user: UserWithPassword) {
    const token = tokenService.generateToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    });

    return {
      message,
      data: toPublicUser(user),
      token,
    };
  }

  private async verifyGoogleIdToken(idToken: string, expectedClientIds: string[]): Promise<GoogleTokenInfo> {
    try {
      const response = await axios.get<GoogleTokenInfo>("https://oauth2.googleapis.com/tokeninfo", {
        params: { id_token: idToken },
        timeout: 10000,
      });

      const tokenInfo = response.data;
      const emailVerified = tokenInfo.email_verified === true || tokenInfo.email_verified === "true";

      if (!tokenInfo.sub) {
        throw new ApiError(401, "Invalid Google token");
      }

      if (!tokenInfo.aud || !expectedClientIds.includes(tokenInfo.aud)) {
        throw new ApiError(401, "Google token audience mismatch");
      }

      if (tokenInfo.iss !== "accounts.google.com" && tokenInfo.iss !== "https://accounts.google.com") {
        throw new ApiError(401, "Invalid Google token issuer");
      }

      if (!emailVerified) {
        throw new ApiError(401, "Google account email is not verified");
      }

      return tokenInfo;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (axios.isAxiosError(error) && (error.code === "ECONNABORTED" || /timeout/i.test(error.message))) {
        throw new ApiError(504, "Google token verification timed out");
      }
      throw new ApiError(401, "Failed to verify Google token");
    }
  }

  private async getAvailableGoogleUsername(name: string, email: string) {
    const emailPrefix = email.split("@")[0] || "google_user";
    const baseUsername = normalizeUsernameCandidate(name || emailPrefix);

    const candidates = [
      baseUsername,
      normalizeUsernameCandidate(`${baseUsername} ${emailPrefix}`),
      normalizeUsernameCandidate(`${baseUsername} ${Date.now().toString(36)}`),
    ];

    for (const candidate of candidates) {
      const existing = await userModel.getUserByUsernameIncludingDeleted(candidate);
      if (!existing) return candidate;
    }

    for (let suffix = 2; suffix < 100; suffix += 1) {
      const candidate = normalizeUsernameCandidate(`${baseUsername} ${suffix}`);
      const existing = await userModel.getUserByUsernameIncludingDeleted(candidate);
      if (!existing) return candidate;
    }

    return normalizeUsernameCandidate(`${baseUsername} ${Date.now().toString(36)}`);
  }

  async googleLogin(googleToken: unknown) {
    if (!googleToken) {
      throw new ApiError(400, "Token is required");
    }

    const googleClientIds = getGoogleClientIds();
    if (googleClientIds.length === 0) {
      throw new ApiError(500, "GOOGLE_CLIENT_ID is not configured");
    }

    const googleData = await this.verifyGoogleIdToken(String(googleToken), googleClientIds);
    if (!googleData.email) {
      throw new ApiError(401, "Invalid Google token");
    }

    const email = googleData.email.trim().toLowerCase();
    let user = await userModel.getUserByEmailIncludingDeleted(email);

    if (user?.status === "deleted" || user?.deleted_at) {
      throw new ApiError(403, "This email belongs to a deleted account");
    }

    if (!user) {
      const username = await this.getAvailableGoogleUsername(googleData.name || "", email);
      const passwordHash = await passwordService.hashPassword(`google_oauth_${Date.now()}`);
      try {
        user = await userModel.createUser(
          username,
          email,
          passwordHash,
          "learner",
          normalizeAvatarUrl(googleData.picture)
        );
      } catch (error: any) {
        if (error?.code === "23505") {
          throw new ApiError(409, "This Google account conflicts with an existing user. Please use another account or contact support.");
        }
        throw error;
      }
    }

    if (user.status !== "active") {
      throw new ApiError(403, "User account is not active");
    }

    return this.generateAuthResponse("Google login successful", user);
  }

  async login(email: unknown, password: unknown) {
    if (!email || !password) {
      throw new ApiError(400, "email and password are required");
    }

    const user = await userModel.getUserByEmail(String(email).trim().toLowerCase());
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (user.status !== "active") {
      throw new ApiError(403, "User account is not active");
    }

    const isPasswordValid = await passwordService.comparePassword(String(password), user.password_hash);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    return this.generateAuthResponse("Login successful", user);
  }

  async createUser(input: { username?: unknown; email?: unknown; password?: unknown; role?: unknown }) {
    const { username, email, password } = input;

    if (!username || !email || !password) {
      throw new ApiError(400, "username, email, and password are required");
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();
    if (!normalizedUsername || !normalizedEmail) {
      throw new ApiError(400, "username, email, and password are required");
    }

    const existingUser = await userModel.getUserByEmailIncludingDeleted(normalizedEmail);
    if (existingUser) {
      throw new ApiError(409, "This email is already registered");
    }

    const passwordHash = await passwordService.hashPassword(String(password));
    try {
      const user = await userModel.createUser(normalizedUsername, normalizedEmail, passwordHash, "learner");
      return toPublicUser(user);
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new ApiError(409, "This email is already registered");
      }
      throw error;
    }
  }
}

export default new UserAuthService();
