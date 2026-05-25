import { ApiError } from "../utils/http.js";

export const toNumberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const requireFiniteNumber = (value: unknown, label: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, `${label} must be a valid number`);
  }
  return parsed;
};

export const optionalFiniteNumber = (value: unknown, label: string) =>
  value === undefined ? undefined : requireFiniteNumber(value, label);

export const requirePositiveFiniteNumber = (value: unknown, label: string) => {
  const parsed = requireFiniteNumber(value, label);
  if (parsed <= 0) {
    throw new ApiError(400, `${label} must be greater than 0`);
  }
  return parsed;
};

export const parsePositiveInt = (value: unknown, label: string) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return parsed;
};

export const parsePagination = (
  query: { limit?: unknown; offset?: unknown },
  options: { defaultLimit?: number; maxLimit?: number } = {}
) => {
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;
  const rawLimit = Number(query.limit);
  const rawOffset = Number(query.offset);

  return {
    limit: Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit, maxLimit),
    offset: Math.max(Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0, 0),
  };
};

export const requireString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const optionalNumber = (value: unknown) => (value === undefined ? undefined : toNumberOrNull(value));

export const optionalStringOrNull = (value: unknown) => {
  const stringValue = requireString(value);
  return stringValue || null;
};

export const isOneOf = <T extends string>(value: unknown, values: readonly T[]): value is T =>
  typeof value === "string" && values.includes(value as T);

export type QueryInput = Record<string, unknown>;
export type BodyInput = Record<string, unknown>;
