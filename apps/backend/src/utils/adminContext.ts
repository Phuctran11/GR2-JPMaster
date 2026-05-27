import type { Request } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export const getAdminUser = (req: Request) => (req as AuthenticatedRequest).user;

export const ownerScope = (req: Request) => {
  const user = getAdminUser(req);
  return user?.role === "owner" ? user.user_id : undefined;
};

export const isSystemAdmin = (req: Request) => getAdminUser(req)?.role === "admin";
