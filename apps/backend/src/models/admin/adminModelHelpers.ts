import type { AdminListParams } from "../admin.model.js";
export { buildUpdateSet, WhereBuilder } from "../sqlHelpers.js";
import { orderDirection as getOrderDirection, withLimitOffset as getLimitOffset } from "../sqlHelpers.js";

export const withLimitOffset = (params: AdminListParams) => getLimitOffset(params);

export const orderDirection = (params: AdminListParams) => getOrderDirection(params.sortOrder);
