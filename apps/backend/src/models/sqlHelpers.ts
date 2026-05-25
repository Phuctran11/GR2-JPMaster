export interface LimitOffsetInput {
  limit?: unknown;
  offset?: unknown;
}

export const withLimitOffset = (
  params: LimitOffsetInput,
  options: { defaultLimit?: number; maxLimit?: number } = {}
) => {
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;
  const rawLimit = Number(params.limit);
  const rawOffset = Number(params.offset);

  return {
    limit: Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit, maxLimit),
    offset: Math.max(Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0, 0),
  };
};

export const orderDirection = (sortOrder?: unknown) => (sortOrder === "asc" ? "ASC" : "DESC");

export const orderByWhitelist = <T extends Record<string, string>>(
  value: unknown,
  allowed: T,
  fallback: keyof T & string
) => allowed[(typeof value === "string" && value in allowed ? value : fallback) as keyof T & string];

export const buildUpdateSet = <T extends Record<string, unknown>, K extends readonly (keyof T & string)[]>(
  input: T,
  fields: K
) => {
  const updates: string[] = [];
  const values: unknown[] = [];
  const indexes: Partial<Record<K[number], number>> = {};

  fields.forEach((field) => {
    if (input[field] !== undefined) {
      values.push(input[field]);
      indexes[field] = values.length;
      updates.push(`${field} = $${values.length}`);
    }
  });

  return { updates, values, indexes };
};

export class WhereBuilder {
  readonly clauses: string[];
  readonly values: unknown[];

  constructor(baseClauses: string[] = [], baseValues: unknown[] = []) {
    this.clauses = [...baseClauses];
    this.values = [...baseValues];
  }

  add(sql: string, ...values: unknown[]) {
    let clause = sql;
    values.forEach((value) => {
      this.values.push(value);
      clause = clause.replace("?", `$${this.values.length}`);
    });
    this.clauses.push(clause);
    return this;
  }

  addIf(condition: boolean, sql: string, value: unknown) {
    if (condition) this.add(sql, value);
    return this;
  }

  addRaw(sql: string) {
    this.clauses.push(sql);
    return this;
  }

  toSql(separator = " AND ") {
    return this.clauses.join(separator);
  }
}
