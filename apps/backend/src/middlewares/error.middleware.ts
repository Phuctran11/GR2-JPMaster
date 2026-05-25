import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { logger } from "../utils/logger.js";

type HttpError = Error & {
  status?: number;
  statusCode?: number;
};

const getNestedErrorMessage = (err: unknown) => {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "error" in err) {
    const nested = (err as { error?: unknown }).error;
    if (nested && typeof nested === "object" && "message" in nested) {
      return String((nested as { message?: unknown }).message);
    }
  }
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  return "";
};

const getNestedHttpCode = (err: unknown) => {
  if (err && typeof err === "object" && "error" in err) {
    const nested = (err as { error?: unknown }).error;
    if (nested && typeof nested === "object" && "http_code" in nested) {
      return Number((nested as { http_code?: unknown }).http_code);
    }
  }
  if (err && typeof err === "object" && "http_code" in err) {
    return Number((err as { http_code?: unknown }).http_code);
  }
  return undefined;
};

export const errorHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message = err.code === "LIMIT_FILE_SIZE" ? "Uploaded file is too large" : err.message;

    logger.error("Request failed", { context: "error.middleware", status, error: message });

    return res.status(status).json({
      error: message,
      details: {
        status,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const nestedMessage = getNestedErrorMessage(err);
  const nestedHttpCode = getNestedHttpCode(err);
  const isTimeoutError = /timeout|request timeout/i.test(nestedMessage);
  const status = err.status || err.statusCode || (isTimeoutError || nestedHttpCode === 499 ? 504 : 500);
  const rawMessage = nestedMessage || err.message || "Internal server error";
  const message = process.env.NODE_ENV === "production" && status >= 500 ? "Internal server error" : rawMessage;

  logger.error("Request failed", {
    context: "error.middleware",
    status,
    error: rawMessage,
    stack: err.stack,
    code: "code" in err ? (err as HttpError & { code?: unknown }).code : undefined,
    cause: "cause" in err ? (err as HttpError & { cause?: unknown }).cause : undefined,
    errors: "errors" in err ? (err as HttpError & { errors?: unknown }).errors : undefined,
  });

  res.status(status).json({
    error: message,
    details: {
      status,
      message,
      timestamp: new Date().toISOString(),
    },
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    details: {
      status: 404,
      message: "Route not found",
      path: req.path,
      method: req.method,
    },
  });
};
