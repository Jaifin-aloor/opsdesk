# OpsDesk — Operations & Dispute Management Platform

OpsDesk is an internal operations platform designed to streamline merchant dispute management, automate dispute processing, and monitor Service Level Agreement (SLA) performance.

The platform provides a centralized interface for operations teams to review disputes, prioritize pending cases, perform approval and rejection actions, and monitor operational performance through a dashboard.

## 1. Problem Statement

Businesses that process large volumes of transactions regularly deal with customer disputes, refund requests, duplicate charges, unauthorized transactions, and other payment-related issues.

Managing these disputes manually can result in:

- Delayed dispute resolution.
- Missed SLA deadlines.
- Inefficient allocation of operational resources.
- Inconsistent decision-making.
- Limited visibility into operational performance.

OpsDesk addresses these problems through automated dispute classification, queue prioritization, SLA monitoring, and centralized operations management.

## 2. Key Features

### Dispute Management
- Centralized dispute management.
- Merchant and customer dispute information.
- Dispute status tracking.
- Individual dispute approval and rejection.
- Batch approval and rejection operations.

### Automated Processing
- Rule-based dispute classification.
- Automated routing based on merchant risk and verification information.
- Queue prioritization.
- Background dispute processing using BullMQ and Redis.

### SLA Monitoring
- Configurable default SLA duration.
- SLA deadline tracking.
- Identification of breached and approaching deadlines.
- Prioritization of disputes based on urgency.

### Operations Dashboard
The Appsmith dashboard provides:

- Open dispute backlog.
- Average resolution time.
- SLA breach rate.
- Refund value processed today.
- Filters for dispute status, queue type, risk tier, merchant, and SLA urgency.
- Searchable and paginated dispute table.
- Individual dispute details.
- Audit history showing actions performed and timestamps.

### Audit Logging
Actions performed on disputes are recorded in the database, providing visibility into dispute resolution activity.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Backend | Node.js, Express 5 |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| Queue Management | BullMQ |
| Queue Storage | Redis 7 |
| Validation | Zod |
| Security Middleware | Helmet |
| API Middleware | CORS |
| Database Driver | node-postgres (pg) |
| Containerization | Docker, Docker Compose |
| Operations Dashboard | Appsmith |

## 4. System Architecture

The application consists of three main components:

**1. Backend API**

The Express and TypeScript backend handles incoming requests, validates data, executes business logic, communicates with PostgreSQL, and exposes endpoints for dispute management, merchants, health checks, and operational metrics.

**2. Database and Background Processing**

PostgreSQL stores merchant information, disputes, and audit logs.

Redis provides the storage layer for BullMQ, which manages background dispute-processing jobs. A separate worker processes queued disputes.

**3. Operations Dashboard**

Appsmith provides the interface used by operations teams to monitor disputes, review cases, apply filters, execute batch actions, and inspect audit history.

### Architecture Overview

```text
             Operations Team
                    |
                    v
           Appsmith Dashboard
                    |
                    v
              Express API
                    |
          +---------+---------+
          |                   |
          v                   v
      PostgreSQL            Redis
          |                   |
          |                   v
          |              BullMQ Queue
          |                   |
          |                   v
          |             Dispute Worker
          |                   |
          +-------------------+
                    |
                    v
             Audit Logging
```

## 5. Database Design

OpsDesk uses PostgreSQL with three primary tables.

### Merchants

Stores merchant information.

- Merchant ID
- Merchant name
- Risk tier (LOW, MEDIUM, HIGH)
- Verification status
- Creation timestamp

### Disputes

Stores customer dispute information.

- Dispute ID
- Merchant ID
- Dispute amount
- Customer reason
- Dispute status
- Queue type
- SLA deadline
- Resolution reason code
- Creation timestamp
- Resolution timestamp

### Audit Logs

Stores actions performed on disputes.

- Audit ID
- Dispute ID
- Action taken
- Performed by
- Timestamp

Database indexes are created to support SLA-based dispute queries, merchant lookups, and audit history retrieval.

## 6. Project Structure

```text
opsdesk/
│
├── backend/
│   ├── scripts/
│   │   └── seed.ts
│   │
│   ├── sql/
│   │   ├── 001_schema.sql
│   │   └── 002_sla_test_data.sql
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── queues/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── workers/
│   │   └── server.ts
│   │
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml
├── package.json
└── README.md
```

## 7. Getting Started

### Prerequisites

- Node.js
- npm
- Docker Desktop
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/Jaifin-aloor/opsdesk
cd opsdesk
```

### Step 2: Start PostgreSQL and Redis

```bash
docker compose up -d
```

This starts:

- PostgreSQL on port 5432.
- Redis on port 6379.

### Step 3: Configure Environment Variables

Navigate to the backend directory:

```bash
cd backend
```

Create your environment file:

```bash
cp .env.example .env
```

The default development configuration is:

```env
PORT=4000

DATABASE_URL=postgresql://opsdesk_user:local_dev_password@localhost:5432/opsdesk

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

DEFAULT_SLA_HOURS=24
APP_ENV=development
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Initialize the Database

Run the database schema:

```bash
docker exec -i opsdesk-postgres psql \
  -U opsdesk_user \
  -d opsdesk < sql/001_schema.sql
```

### Step 6: Seed the Database

```bash
npm run seed
```

The seed script creates:

- 10 sample merchants.
- 60 sample disputes.
- Different merchant risk tiers and verification states.
- Disputes with different SLA deadlines.

### Step 7: Start the Backend API

```bash
npm run dev
```

The API runs on:

```text
http://localhost:4000
```

### Step 8: Start the Background Worker

Open another terminal window:

```bash
cd opsdesk/backend
npm run worker
```

The worker processes queued dispute jobs using BullMQ and Redis.

### Step 9: Build the Project

To verify the TypeScript build:

```bash
npm run build
```

## 8. API Overview

The backend exposes the following route groups:

| Route | Purpose |
|---|---|
| `/health` | Application health checks |
| `/api/merchants` | Merchant-related operations |
| `/api/disputes` | Dispute management operations |
| `/api/metrics` | Operational metrics |

The backend uses Express routing, Zod validation, and centralized error handling.

## 9. Operations Dashboard

The Appsmith dashboard acts as the main interface for operations teams.

It provides visibility into dispute volumes, SLA performance, refund activity, and individual dispute records.

The dashboard also supports filtering, dispute selection, batch operations, and audit-history inspection.

### Dashboard Screenshots

**Dashboard Overview**

![OpsDesk Dashboard Overview](docs/screenshots/dashboard-overview.png)

**Dispute Management**

![OpsDesk Dispute Management](docs/screenshots/dispute-management.png)

**Dispute Details and Audit History**

![OpsDesk Dispute Details](docs/screenshots/dispute-details.png)

## 10. Testing and Verification

The following workflows were tested:

- Dispute filtering across available categories.
- Individual dispute selection and details retrieval.
- Audit history retrieval.
- Individual dispute approval and rejection.
- Batch approval and rejection.
- Dashboard KPI updates after dispute resolution.
- Data consistency after page refresh.
- Backend TypeScript compilation.

## 11. Future Improvements

Potential extensions include:

- Role-based access control for operations teams.
- Advanced dispute analytics and reporting.
- More configurable dispute-processing rules.
- Improved SLA forecasting.
- Notifications for approaching SLA deadlines.
- Detailed operational performance reports.

## 12. Project Objective

OpsDesk demonstrates how backend engineering, database design, asynchronous job processing, business rules, and operational analytics can be combined to solve a practical business operations problem.

The project focuses not only on implementing software functionality but also on improving operational efficiency, reducing manual intervention, and providing better visibility into business processes.

---

**Built as a Business Operations portfolio project.**