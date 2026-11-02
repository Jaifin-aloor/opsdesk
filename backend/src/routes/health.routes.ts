import { Router } from "express";
import { pool } from "../db/pool";
import { asyncHandler } from "../middleware/errorHandler";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
    });
  })
);