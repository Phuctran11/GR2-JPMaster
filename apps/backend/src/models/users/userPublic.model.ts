import databaseService from "../../services/database.service.js";
import type { PublicUser, UserRole, UserStatus } from "./user.types.js";
import { publicUserSelect } from "./user.types.js";

export class UserPublicModel {
  async getUserById(userId: number): Promise<PublicUser | null> {
    const query = `
      SELECT ${publicUserSelect}
      FROM "User"
      WHERE user_id = $1
        AND status <> 'deleted'
        AND deleted_at IS NULL;
    `;
    const result = await databaseService.executeQuery(query, [userId]);
    return result.rows[0] || null;
  }

  async getAllUsers(limit: number = 10, offset: number = 0): Promise<PublicUser[]> {
    const query = `
      SELECT ${publicUserSelect}
      FROM "User"
      WHERE status <> 'deleted'
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const result = await databaseService.executeQuery(query, [limit, offset]);
    return result.rows;
  }

  async updateUser(
    userId: number,
    username: string,
    email: string,
    role: UserRole,
    status: Exclude<UserStatus, "deleted"> = "active"
  ): Promise<PublicUser | null> {
    const query = `
      UPDATE "User"
      SET username = $1, email = $2, role = $3, status = $4, updated_at = NOW()
      WHERE user_id = $5
        AND status <> 'deleted'
        AND deleted_at IS NULL
      RETURNING ${publicUserSelect};
    `;
    const result = await databaseService.executeQuery(query, [username, email, role, status, userId]);
    return result.rows[0] || null;
  }

  async updateUserProfile(userId: number, username: string, email: string, avatarUrl: string | null): Promise<PublicUser | null> {
    const query = `
      UPDATE "User"
      SET username = $1, email = $2, avatar_url = $3, updated_at = NOW()
      WHERE user_id = $4
        AND status = 'active'
        AND deleted_at IS NULL
      RETURNING ${publicUserSelect};
    `;
    const result = await databaseService.executeQuery(query, [username, email, avatarUrl, userId]);
    return result.rows[0] || null;
  }

  async softDeleteUser(userId: number): Promise<boolean> {
    const query = `
      UPDATE "User"
      SET status = 'deleted',
          deleted_at = COALESCE(deleted_at, NOW()),
          updated_at = NOW()
      WHERE user_id = $1
        AND status <> 'deleted'
        AND deleted_at IS NULL;
    `;
    const result = await databaseService.executeQuery(query, [userId]);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteUser(userId: number): Promise<boolean> {
    return this.softDeleteUser(userId);
  }
}

export default new UserPublicModel();
