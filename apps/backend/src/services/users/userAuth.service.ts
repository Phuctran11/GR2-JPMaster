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
      throw new ApiError(401, "Failed to verify Google token");
    }
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

    const email = googleData.email;
    const username = googleData.name || email.split("@")[0];
    let user = await userModel.getUserByEmail(email);

    if (!user) {
      const passwordHash = await passwordService.hashPassword(`google_oauth_${Date.now()}`);
      user = await userModel.createUser(username, email, passwordHash, "learner", normalizeAvatarUrl(googleData.picture));
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

    const user = await userModel.getUserByEmail(String(email));
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

    const existingUser = await userModel.getUserByEmailIncludingDeleted(String(email));
    if (existingUser) {
      throw new ApiError(409, "Email already exists");
    }

    const passwordHash = await passwordService.hashPassword(String(password));
    const user = await userModel.createUser(String(username), String(email), passwordHash, "learner");
    return toPublicUser(user);
  }
}

export default new UserAuthService();
