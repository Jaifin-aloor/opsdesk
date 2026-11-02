"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenDisputes = getOpenDisputes;
exports.getDisputeById = getDisputeById;
exports.createDispute = createDispute;
const pool_1 = require("../db/pool");
async function getOpenDisputes(limit, offset) {
    const result = await pool_1.pool.query(`SELECT
       d.id,
       d.amount,
       d.customer_reason,
       d.status,
       d.queue_type,
       d.sla_deadline,
       d.created_at,
       m.name AS merchant_name,
       m.risk_tier,
       m.is_verified,
       EXTRACT(EPOCH FROM (d.sla_deadline - NOW())) / 3600
         AS hours_to_deadline
     FROM disputes d
     JOIN merchants m ON m.id = d.merchant_id
     WHERE d.status IN ('PENDING', 'MANUAL_REVIEW')
     ORDER BY d.sla_deadline ASC
     LIMIT $1 OFFSET $2`, [limit, offset]);
    return result.rows;
}
async function getDisputeById(id) {
    const dispute = await pool_1.pool.query(`SELECT d.*, m.name AS merchant_name,
            m.risk_tier, m.is_verified
     FROM disputes d
     JOIN merchants m ON m.id = d.merchant_id
     WHERE d.id = $1`, [id]);
    if (dispute.rows.length === 0) {
        return null;
    }
    const audit = await pool_1.pool.query(`SELECT action_taken, performed_by, timestamp
     FROM audit_logs
     WHERE dispute_id = $1
     ORDER BY timestamp DESC`, [id]);
    return {
        ...dispute.rows[0],
        auditHistory: audit.rows,
    };
}
async function createDispute(merchantId, amount, customerReason) {
    const client = await pool_1.pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`INSERT INTO disputes
         (merchant_id, amount, customer_reason, sla_deadline)
       VALUES ($1, $2, $3,
               NOW() + INTERVAL '1 hour' * $4)
       RETURNING *`, [merchantId, amount, customerReason, 24]);
        const dispute = result.rows[0];
        await client.query(`INSERT INTO audit_logs
         (dispute_id, action_taken, performed_by)
       VALUES ($1, $2, $3)`, [dispute.id, "DISPUTE_CREATED", "API"]);
        await client.query("COMMIT");
        return dispute;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=dispute.service.js.map