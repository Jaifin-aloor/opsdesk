"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const pool_1 = require("./db/pool");
const health_routes_1 = require("./routes/health.routes");
const merchants_routes_1 = require("./routes/merchants.routes");
const disputes_routes_1 = require("./routes/disputes.routes");
const metrics_routes_1 = require("./routes/metrics.routes");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.DASHBOARD_ORIGIN || "http://localhost:3000",
}));
app.use(express_1.default.json());
app.use("/health", health_routes_1.healthRouter);
app.use("/api/merchants", merchants_routes_1.merchantsRouter);
app.use("/api/disputes", disputes_routes_1.disputeRouter);
app.use("/api/metrics", metrics_routes_1.metricsRouter);
app.use(errorHandler_1.errorHandler);
const server = app.listen(env_1.env.PORT, () => {
    console.log(`OpsDesk API listening on port ${env_1.env.PORT}`);
});
async function shutdown() {
    server.close();
    await pool_1.pool.end();
    process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
//# sourceMappingURL=server.js.map