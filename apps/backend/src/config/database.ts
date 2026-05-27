import "./env.js";
import { Pool } from "pg";
import { logger } from "../utils/logger.js";

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "DATN_JPMaster",
});

pool.on("error", (err) => {
  logger.error("Unexpected error on idle database client", { context: "database", error: err });
});

export default pool;
