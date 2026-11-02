import express from "express";
import helmet from "helmet";
import cors from "cors";

import { env } from "./config/env";
import { pool } from "./db/pool";

import { healthRouter } from "./routes/health.routes";
import { merchantsRouter } from "./routes/merchants.routes";
import { disputeRouter } from "./routes/disputes.routes";
import { metricsRouter } from "./routes/metrics.routes";

import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.DASHBOARD_ORIGIN || "http://localhost:3000",
  })
);

app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/merchants", merchantsRouter);
app.use("/api/disputes", disputeRouter);
app.use("/api/metrics", metricsRouter);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`OpsDesk API listening on port ${env.PORT}`);
});

async function shutdown() {
  server.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);