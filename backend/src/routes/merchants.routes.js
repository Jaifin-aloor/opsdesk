"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantsRouter = void 0;
const express_1 = require("express");
const pool_1 = require("../db/pool");
const errorHandler_1 = require("../middleware/errorHandler");
exports.merchantsRouter = (0, express_1.Router)();
exports.merchantsRouter.get("/", (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const result = await pool_1.pool.query(`SELECT id, name, risk_tier, is_verified, created_at
       FROM merchants
       ORDER BY id`);
    res.json(result.rows);
}));
//# sourceMappingURL=merchants.routes.js.map