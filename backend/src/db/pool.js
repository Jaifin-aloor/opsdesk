"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const env_1 = require("../config/env");
exports.pool = new pg_1.Pool({
    connectionString: env_1.env.DATABASE_URL,
    ssl: env_1.env.APP_ENV === "production"
        ? { rejectUnauthorized: true }
        : false,
});
exports.pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error", error);
});
//# sourceMappingURL=pool.js.map