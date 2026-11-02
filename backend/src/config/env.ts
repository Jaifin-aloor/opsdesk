import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DASHBOARD_ORIGIN: z.string().optional(),
  APP_ENV: z.string().default("development"),
});

export const env = envSchema.parse(process.env);