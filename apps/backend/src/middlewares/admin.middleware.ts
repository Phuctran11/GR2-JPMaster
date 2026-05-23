import { Response, NextFunction } from "express";
import { AuthenticatedRequest, authMiddleware } from "./auth.middleware.js";

export const adminMiddleware = [
  authMiddleware,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== "admin" && req.user?.role !== "owner") {
      return res.status(403).json({ error: "Admin or owner access is required" });
    }

    next();
  },
];

export default adminMiddleware;
