import { pool } from "../db/pool";
import { disputeQueue } from "../queues/dispute.queue";

export async function getOpenDisputes(limit: number, offset: number) {
  const result = await pool.query(
    `SELECT
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
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows;
}

export async function getDisputeById(id: number) {
  const dispute = await pool.query(
    `SELECT d.*, m.name AS merchant_name,
            m.risk_tier, m.is_verified
     FROM disputes d
     JOIN merchants m ON m.id = d.merchant_id
     WHERE d.id = $1`,
    [id]
  );

  if (dispute.rows.length === 0) {
    return null;
  }

  const audit = await pool.query(
    `SELECT action_taken, performed_by, timestamp
     FROM audit_logs
     WHERE dispute_id = $1
     ORDER BY timestamp DESC`,
    [id]
  );

  return {
    ...dispute.rows[0],
    auditHistory: audit.rows,
  };
}

export async function createDispute(
  merchantId: number,
  amount: number,
  customerReason: string
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO disputes
         (merchant_id, amount, customer_reason, sla_deadline)
       VALUES ($1, $2, $3,
               NOW() + INTERVAL '1 hour' * $4)
       RETURNING *`,
      [merchantId, amount, customerReason, 24]
    );

    const dispute = result.rows[0];

    await client.query(
      `INSERT INTO audit_logs
         (dispute_id, action_taken, performed_by)
       VALUES ($1, $2, $3)`,
      [dispute.id, "DISPUTE_CREATED", "API"]
    );

    await client.query("COMMIT");

    await disputeQueue.add(
    "evaluate-dispute",
    { disputeId: dispute.id },
    {
        jobId: `dispute-${dispute.id}`,
        attempts: 3,
        backoff: {
        type: "exponential",
        delay: 2000,
        },
        removeOnComplete: 500,
        removeOnFail: 1000,
    }
    );

    return dispute;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}



export async function batchApproveDisputes(
  disputeIds: number[],
  performedBy: string
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const locked = await client.query(
      `SELECT id
       FROM disputes
       WHERE id = ANY($1::bigint[])
         AND status IN ('PENDING', 'MANUAL_REVIEW')
       FOR UPDATE`,
      [disputeIds]
    );

    if (locked.rows.length !== disputeIds.length) {
      await client.query("ROLLBACK");
      return { conflict: true };
    }

    const updated = await client.query(
      `UPDATE disputes
       SET status = 'APPROVED',
           resolved_at = NOW(),
           reason_code = NULL
       WHERE id = ANY($1::bigint[])
       RETURNING id`,
      [disputeIds]
    );

    for (const dispute of updated.rows) {
      await client.query(
        `INSERT INTO audit_logs
           (dispute_id, action_taken, performed_by)
         VALUES ($1, $2, $3)`,
        [dispute.id, "APPROVED", performedBy]
      );
    }

    await client.query("COMMIT");

    return {
      conflict: false,
      approvedCount: updated.rows.length,
      approvedIds: updated.rows.map((row) => row.id),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function batchRejectDisputes(
  disputeIds: number[],
  reasonCode: string,
  performedBy: string
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const locked = await client.query(
      `SELECT id
       FROM disputes
       WHERE id = ANY($1::bigint[])
         AND status IN ('PENDING', 'MANUAL_REVIEW')
       FOR UPDATE`,
      [disputeIds]
    );

    if (locked.rows.length !== disputeIds.length) {
      await client.query("ROLLBACK");
      return { conflict: true };
    }

    const updated = await client.query(
      `UPDATE disputes
       SET status = 'REJECTED',
           reason_code = $2,
           resolved_at = NOW()
       WHERE id = ANY($1::bigint[])
       RETURNING id`,
      [disputeIds, reasonCode]
    );

    for (const dispute of updated.rows) {
      await client.query(
        `INSERT INTO audit_logs
           (dispute_id, action_taken, performed_by)
         VALUES ($1, $2, $3)`,
        [dispute.id, `REJECTED: ${reasonCode}`, performedBy]
      );
    }

    await client.query("COMMIT");

    return {
      conflict: false,
      rejectedCount: updated.rows.length,
      rejectedIds: updated.rows.map((row) => row.id),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
