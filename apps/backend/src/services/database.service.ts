import pool from "../config/database.js";
import type { PoolClient } from "pg";
import { logger } from "../utils/logger.js";

export class DatabaseService {
  async executeQuery(query: string, values?: unknown[]) {
    try {
      const result = await pool.query(query, values);
      return result;
    } catch (error) {
      logger.error("Database query failed", { context: "database.service", error });
      throw error;
    }
  }

  async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new DatabaseService();
