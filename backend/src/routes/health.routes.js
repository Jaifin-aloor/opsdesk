"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const pool_1 = require("../db/pool");
const errorHandler_1 = require("../middleware/errorHandler");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get("/", (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    await pool_1.pool.query("SELECT 1");
    res.json({
        status: "ok",
        database: "connected",
    });
}));
//# sourceMappingURL=health.routes.js.map