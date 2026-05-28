import databaseService from "../../services/database.service.js";
import type { UserRole, UserWithPassword } from "./user.types.js";
import { userWithPasswordSelect } from "./user.types.js";

export class UserAuthModel {
  async createUser(
    username: string,
    email: string,
    passwordHash: string,
    role: UserRole = "learner",
    avatarUrl: string | null = null
  ): Promise<UserWithPassword> {
    const query = `
      INSERT INTO "User" (username, email, password_hash, avatar_url, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
      RETURNING ${userWithPasswordSelect};
    `;
    const result = await databaseService.executeQuery(query, [username, email, passwordHash, avatarUrl, role]);
    return result.rows[0];
  }

  async getUserByEmail(email: string): Promise<UserWithPassword | null> {
    const query = `
      SELECT ${userWithPasswordSelect}
      FROM "User"
      WHERE LOWER(email) = LOWER($1)
        AND status <> 'deleted'
        AND deleted_at IS NULL;
    `;
    const result = await databaseService.executeQuery(query, [email]);
    return result.rows[0] || null;
  }

  async getUserByEmailIncludingDeleted(email: string): Promise<UserWithPassword | null> {
    const query = `
      SELECT ${userWithPasswordSelect}
      FROM "User"
      WHERE LOWER(email) = LOWER($1);
    `;
    const result = await databaseService.executeQuery(query, [email]);
    return result.rows[0] || null;
  }

  async getUserByUsernameIncludingDeleted(username: string): Promise<UserWithPassword | null> {
    const query = `
      SELECT ${userWithPasswordSelect}
      FROM "User"
      WHERE LOWER(username) = LOWER($1);
    `;
    const result = await databaseService.executeQuery(query, [username]);
    return result.rows[0] || null;
  }
}

export default new UserAuthModel();
