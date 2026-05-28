import "./env.js";
import { Pool, type PoolConfig } from "pg";
import { logger } from "../utils/logger.js";

const shouldUseSsl = () => {
  const configured = process.env.DB_SSL?.trim().toLowerCase();
  return configured === "true" || configured === "1" || configured === "require";
};

const getDatabaseConfig = (): PoolConfig => {
  const connectionString = process.env.DATABASE_URL?.trim();
  const ssl = shouldUseSsl() ? { rejectUnauthorized: false } : undefined;

  if (connectionString) {
    return {
      connectionString,
      ssl,
    };
  }

  return {
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "DATN_JPMaster",
    ssl,
  };
};

const pool = new Pool(getDatabaseConfig());

pool.on("error", (err) => {
  logger.error("Unexpected error on idle database client", { context: "database", error: err });
});

export default pool;
