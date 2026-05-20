import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import axios from "axios";
import userModel from "../models/user.model.js";
import passwordService from "../services/password.service.js";
import tokenService from "../services/token.service.js";

type UserRole = "guest" | "learner" | "admin";
const VALID_ROLES: UserRole[] = ["guest", "learner", "admin"];

interface GoogleTokenInfo {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  iss?: string;
  name?: string;
  picture?: string;
  sub?: string;
}

function createHttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}

export class UserController {
  private toPublicUser(user: Awaited<ReturnType<typeof userModel.getUserById>>) {
    if (!user) return null;
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { token: googleToken } = req.body;
      const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

      if (!googleToken) {
        return res.status(400).json({ error: 'Token is required' });
      }

      if (!googleClientId) {
        throw createHttpError('GOOGLE_CLIENT_ID is not configured', 500);
      }

      const googleData = await this.verifyGoogleIdToken(googleToken, googleClientId);

      if (!googleData.email) {
        throw createHttpError('Invalid Google token', 401);
      }

      const email = googleData.email;
      const username = googleData.name || email.split('@')[0];

      let user = await userModel.getUserByEmail(email);

      if (!user) {
        // Create new user from Google
        const passwordHash = await passwordService.hashPassword(`google_oauth_${Date.now()}`);
        user = await userModel.createUser(username, email, passwordHash, 'learner');
      }

      const { password_hash, ...userWithoutPassword } = user;
      const token = tokenService.generateToken({
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      });

      return res.status(200).json({ message: 'Google login successful', data: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        const status = (error as Error & { status?: number }).status || 500;
        return res.status(status).json({ error: error.message });
      }

      next(error);
    }
  }

  private async verifyGoogleIdToken(idToken: string, expectedClientId: string): Promise<GoogleTokenInfo> {
    try {
      const response = await axios.get<GoogleTokenInfo>('https://oauth2.googleapis.com/tokeninfo', {
        params: { id_token: idToken },
      });

      const tokenInfo = response.data;
      const emailVerified = tokenInfo.email_verified === true || tokenInfo.email_verified === 'true';

      if (!tokenInfo.sub) {
        throw createHttpError('Invalid Google token', 401);
      }

      if (tokenInfo.aud !== expectedClientId) {
        throw createHttpError('Google token audience mismatch', 401);
      }

      if (tokenInfo.iss !== 'accounts.google.com' && tokenInfo.iss !== 'https://accounts.google.com') {
        throw createHttpError('Invalid Google token issuer', 401);
      }

      if (!emailVerified) {
        throw createHttpError('Google account email is not verified', 401);
      }

      return tokenInfo;
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error;
      }

      throw createHttpError('Failed to verify Google token', 401);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "email and password are required" });
      }

      const user = await userModel.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isPasswordValid = await passwordService.comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const { password_hash, ...userWithoutPassword } = user;
      const token = tokenService.generateToken({
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      });

      return res.status(200).json({ message: "Login successful", data: userWithoutPassword, token });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password, role = "learner" } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: "username, email, and password are required" });
      }

      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
      }

      const existingUser = await userModel.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already exists" });
      }

      const passwordHash = await passwordService.hashPassword(password);
      const user = await userModel.createUser(username, email, passwordHash, role as UserRole);
      const { password_hash, ...userWithoutPassword } = user;

      return res.status(201).json({ message: "User created successfully", data: userWithoutPassword });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 100);
      const offset = Number(req.query.offset) || 0;

      const users = await userModel.getAllUsers(limit, offset);
      return res.status(200).json({ data: users, count: users.length });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const user = await userModel.getUserById(req.user.user_id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({ data: this.toPublicUser(user) });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { username, email } = req.body;
      const nextUsername = typeof username === "string" ? username.trim() : "";
      const nextEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

      if (!nextUsername || !nextEmail) {
        return res.status(400).json({ error: "username and email are required" });
      }

      const existingEmailUser = await userModel.getUserByEmail(nextEmail);
      if (existingEmailUser && existingEmailUser.user_id !== req.user.user_id) {
        return res.status(409).json({ error: "Email already exists" });
      }

      const updatedUser = await userModel.updateUserProfile(req.user.user_id, nextUsername, nextEmail);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({
        message: "Profile updated successfully",
        data: this.toPublicUser(updatedUser),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await userModel.getUserById(Number(id));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { username, email, role } = req.body;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      if (!username || !email || !role) {
        return res.status(400).json({ error: "username, email, and role are required" });
      }

      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
      }

      const existingUser = await userModel.getUserById(Number(id));
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = await userModel.updateUser(Number(id), username, email, role as UserRole);
      return res.status(200).json({ message: "User updated successfully", data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const success = await userModel.deleteUser(Number(id));

      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
