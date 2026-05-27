import databaseService from "../../services/database.service.js";
import type { AdminListParams } from "../admin.model.js";
import { WhereBuilder } from "../sqlHelpers.js";
import { orderDirection, withLimitOffset } from "./adminModelHelpers.js";

export class AdminUsersModel {
  private buildUserWhere(params: AdminListParams) {
    const where = new WhereBuilder([`status <> 'deleted'`, `deleted_at IS NULL`]);

    if (params.search?.trim()) {
      const search = `%${params.search.trim()}%`;
      where.add(`(username ILIKE ? OR email ILIKE ?)`, search, search);
    }

    where.addIf(Boolean(params.role && params.role !== "all"), `role = ?`, params.role);

    return { values: where.values, whereSql: where.toSql() };
  }

  async listUsers(params: AdminListParams) {
    const { limit, offset } = withLimitOffset(params);
    const direction = orderDirection(params);
    const { values, whereSql } = this.buildUserWhere(params);

    values.push(limit, offset);
    const query = `
      SELECT user_id, username, email, role, status, deleted_at, created_at, updated_at
      FROM "User"
      WHERE ${whereSql}
      ORDER BY user_id ${direction}
      LIMIT $${values.length - 1} OFFSET $${values.length};
    `;
    const result = await databaseService.executeQuery(query, values);
    return result.rows;
  }

  async countUsers(params: AdminListParams): Promise<number> {
    const { values, whereSql } = this.buildUserWhere(params);
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(*)::int AS total_count
        FROM "User"
        WHERE ${whereSql};
      `,
      values
    );
    return Number(result.rows[0]?.total_count || 0);
  }

  async softDeleteUser(userId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "User"
        SET status = 'deleted',
            deleted_at = COALESCE(deleted_at, NOW()),
            updated_at = NOW()
        WHERE user_id = $1
          AND status <> 'deleted'
          AND deleted_at IS NULL;
      `,
      [userId]
    );
    return Boolean(result.rowCount);
  }
}

export default new AdminUsersModel();
