import { Router } from "express";
import { pool } from "../db/pool";
import { asyncHandler } from "../middleware/errorHandler";

export const merchantsRouter = Router();

merchantsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await pool.query(
      `SELECT id, name, risk_tier, is_verified, created_at
       FROM merchants
       ORDER BY id`
    );

    res.json(result.rows);
  })
);