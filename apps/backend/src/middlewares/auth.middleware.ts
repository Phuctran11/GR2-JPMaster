import { Request, Response, NextFunction } from 'express';
import tokenService from '../services/token.service.js';
import userModel from '../models/user.model.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: string;
  };
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }

  const token = tokenService.extractToken(authHeader);
  
  if (!token) {
    return res.status(401).json({ error: 'Invalid authorization header format' });
  }

  const payload = tokenService.verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await userModel.getUserById(payload.user_id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User account is not active' });
    }

    req.user = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
