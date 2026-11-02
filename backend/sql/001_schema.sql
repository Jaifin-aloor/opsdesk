CREATE TABLE merchants (
id BIGSERIAL PRIMARY KEY,
name TEXT NOT NULL,
risk_tier TEXT NOT NULL CHECK (risk_tier IN ('LOW','MEDIUM','HIGH')),
is_verified BOOLEAN NOT NULL DEFAULT FALSE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE disputes (
id BIGSERIAL PRIMARY KEY,
merchant_id BIGINT NOT NULL REFERENCES merchants(id),
amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
customer_reason TEXT NOT NULL,
status TEXT NOT NULL DEFAULT 'PENDING'
CHECK (status IN ('PENDING','AUTO_APPROVED','MANUAL_REVIEW','REJECTED')),
queue_type TEXT NOT NULL DEFAULT 'STANDARD'
CHECK (queue_type IN ('STANDARD','SENIOR')),
sla_deadline TIMESTAMPTZ NOT NULL,
reason_code TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
resolved_at TIMESTAMPTZ
);
CREATE TABLE audit_logs (
id BIGSERIAL PRIMARY KEY,
dispute_id BIGINT NOT NULL REFERENCES disputes(id),
action_taken TEXT NOT NULL,
performed_by TEXT NOT NULL,
timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_disputes_open_sla
ON disputes (sla_deadline)
WHERE status IN ('PENDING','MANUAL_REVIEW');
CREATE INDEX idx_disputes_merchant ON disputes(merchant_id);
CREATE INDEX idx_audit_dispute_time ON audit_logs(dispute_id, timestamp DESC);