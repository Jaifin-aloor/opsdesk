import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validate";
import {
  getOpenDisputes,
  getDisputeById,
  createDispute,
} from "../services/dispute.service";

export const disputeRouter = Router();

const createDisputeSchema = z.object({
  merchantId: z.number().int().positive(),
  amount: z.number().positive(),
  customerReason: z.string().trim().min(3).max(500),
});

// GET /api/disputes
disputeRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const disputes = await getOpenDisputes(limit, offset);

    res.json({
      page,
      limit,
      data: disputes,
    });
  })
);

// GET /api/disputes/:id
disputeRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid dispute ID" });
      return;
    }

    const dispute = await getDisputeById(id);

    if (!dispute) {
      res.status(404).json({ error: "Dispute not found" });
      return;
    }

    res.json(dispute);
  })
);

// POST /api/disputes
disputeRouter.post(
  "/",
  validateBody(createDisputeSchema),
  asyncHandler(async (req, res) => {
    const { merchantId, amount, customerReason } = req.body;

    const dispute = await createDispute(
      merchantId,
      amount,
      customerReason
    );

    res.status(201).json({
      message: "Dispute created successfully",
      data: dispute,
    });
  })
);