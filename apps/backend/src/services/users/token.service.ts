import jwt from 'jsonwebtoken';
import { getJwtExpiresIn } from '../../config/runtime.js';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return secret;
};

export interface JwtPayload {
  user_id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class TokenService {
  generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, getSecretKey(), { expiresIn: getJwtExpiresIn() });
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, getSecretKey()) as JwtPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    if (!authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }
}

export default new TokenService();
