import "./env.js";
import type { SignOptions } from "jsonwebtoken";

const isProduction = () => process.env.NODE_ENV === "production";

const requireProductionValue = (key: string, value: string | undefined) => {
  const normalized = value?.trim();
  if (isProduction() && !normalized) {
    throw new Error(`${key} is required in production`);
  }
  return normalized;
};

const positiveNumberFromEnv = (key: string, fallback: number) => {
  const configured = Number(process.env[key] || fallback);
  if (!Number.isFinite(configured) || configured <= 0) {
    throw new Error(`${key} must be a positive number`);
  }
  return configured;
};

export const getJsonBodyLimit = () => process.env.JSON_BODY_LIMIT?.trim() || "1mb";

export const getCorsOrigins = () => {
  const configuredOrigins = requireProductionValue(
    "CORS_ORIGINS or FRONTEND_URL",
    process.env.CORS_ORIGINS || process.env.FRONTEND_URL
  );

  const origins = (configuredOrigins || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length ? origins : ["http://localhost:5173"];
};

export const getFrontendUrl = () => {
  const frontendUrl = requireProductionValue("FRONTEND_URL", process.env.FRONTEND_URL);
  return frontendUrl || "http://localhost:5173";
};

export const getMaxUploadFileSizeMb = () => positiveNumberFromEnv("MAX_UPLOAD_FILE_SIZE_MB", 50);

export const getServerRequestTimeoutMs = () => positiveNumberFromEnv("SERVER_REQUEST_TIMEOUT_MS", 2 * 60 * 1000);

export const getServerHeadersTimeoutMs = () => {
  const requestTimeoutMs = getServerRequestTimeoutMs();
  const headersTimeoutMs = positiveNumberFromEnv("SERVER_HEADERS_TIMEOUT_MS", 65 * 1000);
  if (headersTimeoutMs >= requestTimeoutMs) {
    throw new Error("SERVER_HEADERS_TIMEOUT_MS must be lower than SERVER_REQUEST_TIMEOUT_MS");
  }
  return headersTimeoutMs;
};

export const getJwtExpiresIn = (): SignOptions["expiresIn"] =>
  (process.env.JWT_EXPIRES_IN?.trim() || "24h") as SignOptions["expiresIn"];
