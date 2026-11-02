import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl:
    env.APP_ENV === "production"
      ? { rejectUnauthorized: true }
      : false,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error", error);
});