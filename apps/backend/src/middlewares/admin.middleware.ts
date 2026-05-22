import { Response, NextFunction } from "express";
import { AuthenticatedRequest, authMiddleware } from "./auth.middleware.js";

export const adminMiddleware = [
  authMiddleware,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access is required" });
    }

    next();
  },
];

export default adminMiddleware;
