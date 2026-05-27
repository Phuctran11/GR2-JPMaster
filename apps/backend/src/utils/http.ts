import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (handler: RequestHandler): RequestHandler => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const ok = <T>(res: Response, data: T, extra: Record<string, unknown> = {}) =>
  res.status(200).json({ data, ...extra });

export const created = <T>(res: Response, message: string, data: T) =>
  res.status(201).json({ message, data });

export const message = (res: Response, text: string) => res.status(200).json({ message: text });

export const paginated = <T>(res: Response, data: T[], totalCount?: number, extra: Record<string, unknown> = {}) =>
  res.status(200).json({
    data,
    count: data.length,
    ...(totalCount !== undefined ? { total_count: totalCount } : {}),
    ...extra,
  });

export const requireUser = (req: AuthenticatedRequest) => {
  if (!req.user) throw new ApiError(401, "User not authenticated");
  return req.user;
};

