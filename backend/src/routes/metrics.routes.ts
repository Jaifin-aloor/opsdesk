import { Router } from "express";
import { pool } from "../db/pool";
import { asyncHandler } from "../middleware/errorHandler";

export const metricsRouter = Router();

metricsRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const result = await pool.query(`
      SELECT
        (
          SELECT COUNT(*)::int
          FROM disputes
          WHERE status IN ('PENDING', 'MANUAL_REVIEW')
        ) AS "openBacklogCount",

        (
          SELECT COALESCE(
            ROUND(
              AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60)::numeric,
              1
            ),
            0
          )
          FROM disputes
          WHERE resolved_at IS NOT NULL
            AND resolved_at >= NOW() - INTERVAL '30 days'
        ) AS "avgResolutionMinutes",

        (
          SELECT COALESCE(
            ROUND(
              100.0 * COUNT(*) FILTER (
                WHERE resolved_at > sla_deadline
              ) / NULLIF(COUNT(*), 0),
              1
            ),
            0
          )
          FROM disputes
          WHERE resolved_at IS NOT NULL
            AND resolved_at >= NOW() - INTERVAL '30 days'
        ) AS "slaBreachRatePct",

        (
          SELECT COALESCE(SUM(amount), 0)
          FROM disputes
          WHERE status IN ('AUTO_APPROVED', 'APPROVED')
            AND resolved_at >= date_trunc('day', NOW())
            AND resolved_at < date_trunc('day', NOW()) + INTERVAL '1 day'
        ) AS "refundValueToday"
    `);

    res.json(result.rows[0]);
  })
);