"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disputeRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const dispute_service_1 = require("../services/dispute.service");
exports.disputeRouter = (0, express_1.Router)();
const createDisputeSchema = zod_1.z.object({
    merchantId: zod_1.z.number().int().positive(),
    amount: zod_1.z.number().positive(),
    customerReason: zod_1.z.string().trim().min(3).max(500),
});
// GET /api/disputes
exports.disputeRouter.get("/", (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    const disputes = await (0, dispute_service_1.getOpenDisputes)(limit, offset);
    res.json({
        page,
        limit,
        data: disputes,
    });
}));
// GET /api/disputes/:id
exports.disputeRouter.get("/:id", (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: "Invalid dispute ID" });
        return;
    }
    const dispute = await (0, dispute_service_1.getDisputeById)(id);
    if (!dispute) {
        res.status(404).json({ error: "Dispute not found" });
        return;
    }
    res.json(dispute);
}));
// POST /api/disputes
exports.disputeRouter.post("/", (0, validate_1.validateBody)(createDisputeSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { merchantId, amount, customerReason } = req.body;
    const dispute = await (0, dispute_service_1.createDispute)(merchantId, amount, customerReason);
    res.status(201).json({
        message: "Dispute created successfully",
        data: dispute,
    });
}));
//# sourceMappingURL=disputes.routes.js.map