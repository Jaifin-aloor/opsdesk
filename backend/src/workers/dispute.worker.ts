import { Worker } from "bullmq";
import { redisConnection } from "../queues/dispute.queue";
import { pool } from "../db/pool";

const worker = new Worker(
  "dispute-evaluation",
  async (job) => {
    const { disputeId } = job.data;

    console.log(`Processing job ${job.id}, dispute ${disputeId}`);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Get the dispute and lock its row
      const result = await client.query(
        `SELECT
           d.id,
           d.status,
           d.amount,
           d.merchant_id,
           m.risk_tier,
           m.is_verified
         FROM disputes d
         JOIN merchants m ON m.id = d.merchant_id
         WHERE d.id = $1
         FOR UPDATE OF d`,
        [disputeId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Dispute ${disputeId} not found`);
      }

      const dispute = result.rows[0];

      // Do not process a dispute that has already changed status
      if (dispute.status !== "PENDING") {
        await client.query("COMMIT");
        console.log(`Dispute ${disputeId} is no longer pending`);
        return;
      }

      const amount = Number(dispute.amount);

      let status: string;
      let queueType: string;
      let auditAction: string;
      let resolvedAt: Date | null = null;

      // Rule 1: High risk or high value
      if (dispute.risk_tier === "HIGH" || amount > 25000) {
        status = "MANUAL_REVIEW";
        queueType = "SENIOR";
        auditAction = "ROUTED_TO_SENIOR_REVIEW";
      }

      // Rule 2: Verified, low-risk, low-value
      else if (
        dispute.is_verified &&
        dispute.risk_tier === "LOW" &&
        amount < 1500
      ) {
        status = "AUTO_APPROVED";
        queueType = "STANDARD";
        auditAction = "AUTO_APPROVED_LOW_RISK";
        resolvedAt = new Date();
      }

      // Rule 3: Everything else
      else {
        status = "MANUAL_REVIEW";
        queueType = "STANDARD";
        auditAction = "ROUTED_TO_STANDARD_REVIEW";
      }

      // Update the dispute
      await client.query(
        `UPDATE disputes
         SET status = $1,
             queue_type = $2,
             resolved_at = $3
         WHERE id = $4`,
        [status, queueType, resolvedAt, disputeId]
      );

      // Insert the audit event
      await client.query(
        `INSERT INTO audit_logs
         (dispute_id, action_taken, performed_by)
         VALUES ($1, $2, $3)`,
        [disputeId, auditAction, "SYSTEM_WORKER"]
      );

      await client.query("COMMIT");

      console.log(
        `Dispute ${disputeId}: ${status}, queue: ${queueType}`
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
  {
    connection: redisConnection,
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

worker.on("error", (error) => {
  console.error("Worker error:", error);
});

console.log("Dispute worker is running...");