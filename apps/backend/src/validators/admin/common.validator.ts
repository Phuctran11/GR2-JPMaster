import type { SortOrder } from "../../models/admin.model.js";
export {
  isOneOf,
  optionalFiniteNumber,
  optionalNumber,
  optionalStringOrNull,
  parsePagination,
  requireFiniteNumber,
  requirePositiveFiniteNumber,
  requireString,
  toNumberOrNull,
} from "../common.validator.js";

export const parseSortOrder = (value: unknown): SortOrder => (value === "asc" ? "asc" : "desc");

export const parseAdminPagination = (query: { limit?: unknown; offset?: unknown }) => {
  const rawLimit = Number(query.limit);
  const rawOffset = Number(query.offset);
  return {
    limit: Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 20, 100),
    offset: Math.max(Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0, 0),
  };
};

export type QueryInput = Record<string, unknown>;
export type BodyInput = Record<string, unknown>;
