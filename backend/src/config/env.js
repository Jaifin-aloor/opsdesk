"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().min(1),
    DASHBOARD_ORIGIN: zod_1.z.string().optional(),
    APP_ENV: zod_1.z.string().default("development"),
});
exports.env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map