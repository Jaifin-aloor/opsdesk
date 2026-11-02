
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Clear existing demo data before inserting
    await client.query(`
      TRUNCATE TABLE audit_logs, disputes, merchants
      RESTART IDENTITY CASCADE
    `);

    // Create 10 merchants
    const merchants = [
      ["Northstar Retail", "LOW", true],
      ["BluePeak Stores", "LOW", true],
      ["Cedar Commerce", "LOW", false],
      ["UrbanCart", "MEDIUM", true],
      ["Maple Market", "MEDIUM", false],
      ["Vertex Supplies", "HIGH", true],
      ["CloudNine Goods", "HIGH", false],
      ["Silverline Traders", "LOW", true],
      ["Evergreen Shop", "MEDIUM", true],
      ["HarborPoint Retail", "HIGH", true],
    ];

    for (const merchant of merchants) {
      await client.query(
        `INSERT INTO merchants (name, risk_tier, is_verified)
         VALUES ($1, $2, $3)`,
        merchant
      );
    }

    // Get merchant IDs
    const result = await client.query(
      "SELECT id FROM merchants ORDER BY id"
    );

    const merchantIds = result.rows.map((row) => row.id);

    // SLA deadline scenarios
    const slaOffsets = [
      -2,  // Already breached
      1,   // Due within 2 hours
      6,   // Due within 12 hours
      48,  // Due later
    ];

    // Dispute scenarios
    const disputes = [
      { amount: 1000, merchant: 0, reason: "Item not received" },
      { amount: 1499, merchant: 1, reason: "Damaged product" },
      { amount: 1500, merchant: 0, reason: "Incorrect item" },
      { amount: 2000, merchant: 2, reason: "Refund requested" },
      { amount: 5000, merchant: 3, reason: "Payment issue" },
      { amount: 10000, merchant: 4, reason: "Duplicate charge" },
      { amount: 25000, merchant: 8, reason: "Product not delivered" },
      { amount: 25001, merchant: 5, reason: "Unauthorized transaction" },
      { amount: 30000, merchant: 6, reason: "Transaction dispute" },
      { amount: 750, merchant: 7, reason: "Wrong product received" },
    ];

    // Insert 60 disputes
    for (let i = 0; i < 60; i++) {
      const dispute = disputes[i % disputes.length];
      const slaHours = slaOffsets[i % slaOffsets.length];

      const deadline = new Date(
        Date.now() + slaHours * 60 * 60 * 1000
      );

      await client.query(
        `INSERT INTO disputes
          (merchant_id, amount, customer_reason, sla_deadline)
         VALUES ($1, $2, $3, $4)`,
        [
          merchantIds[dispute.merchant],
          dispute.amount,
          dispute.reason,
          deadline,
        ]
      );
    }

    await client.query("COMMIT");

    console.log("Database seeded successfully.");
    console.log("10 merchants inserted.");
    console.log("60 disputes inserted.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
