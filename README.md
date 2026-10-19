# 💸 PayHub — High-Resilience Pix Payment Hub & Webhook Engine

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Async_Queues-orange?style=for-the-badge)](https://bullmq.io/)
[![StarkBank](https://img.shields.io/badge/StarkBank-PIX_SDK-darkred?style=for-the-badge)](https://starkbank.com/)

> **Enterprise-grade, asynchronous Pix payment platform** with instant QR Code generation, automated StarkBank integration, resilient webhook ingestion with Redis queue workers, and Domain-Driven Design (DDD) principles.

---

## 🏗️ Architecture & Asynchronous Flow

PayHub is engineered for financial-grade resilience and zero data-loss during webhook bursts. When a Pix invoice is paid at StarkBank, the incoming webhook is acknowledged immediately and dispatched to an asynchronous BullMQ queue, offloading heavy processing from the HTTP layer.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Customer
    participant NextWeb as 🌐 Next.js Web App
    participant Stark as 🏦 StarkBank API
    participant WebhookAPI as ⚡ Webhook Endpoint (/api/webhooks)
    participant Redis as 📦 Redis (BullMQ Queue)
    participant Worker as ⚙️ Background Worker
    participant DB as 🗄️ PostgreSQL (Prisma)

    Customer->>NextWeb: Request Pix Dynamic Charge (Amount, Document)
    NextWeb->>DB: Create Transaction (Status: PENDING)
    NextWeb->>Stark: Create Pix Invoice & Dynamic BRCode
    Stark-->>NextWeb: Return Invoice ID, BRCode & QRCode
    NextWeb-->>Customer: Display Pix Copy & Paste + QR Code

    Note over Customer,Stark: Customer pays through their Banking App
    Stark->>WebhookAPI: POST Webhook (Invoice Paid Event)
    WebhookAPI->>Redis: Enqueue Job (starkbank-webhooks)
    WebhookAPI-->>Stark: 200 OK (Fast Ack)

    Worker->>Redis: Consume Webhook Job
    Worker->>DB: Atomically Update Transaction (Status: PAID / COMPLETED)
    Worker->>DB: Compute Net Amount & Fees (Integer Cents)
```

---

## 🎯 Key Architectural Highlights (Senior Engineering)

### 1. **Domain-Driven Design (DDD) & Value Objects**
- **Zero Floating-Point Inaccuracies:** All financial values (`amount`, `fee`, `netAmount`) are strictly modeled as integer cents internally (`Money.vo.ts`).
- **Strict Domain Validations:** Encapsulated Value Objects for documents (`Document.vo.ts`) providing CPF/CNPJ checksum validation and unmasking before persistence.
- **Typed DTOs:** Strongly-typed contracts for transactions and user sessions decoupling domain logic from UI presentation.

### 2. **Resilient Asynchronous Webhook Processing**
- Webhook endpoints immediately acknowledge HTTP requests with `200 OK` after pushing payloads to Redis, preventing gateway timeouts and StarkBank retries.
- Standalone background worker (`worker/webhook-processor.ts`) driven by **BullMQ**, handling concurrency, retry backoffs, and dead-letter queues.

### 3. **Cryptographic & Gateway Security**
- ECDSA Elliptic Curve key-pair generation utility (`scripts/generate-stark-keys.ts`) for authenticating with StarkBank.
- NextAuth.js multi-provider authentication (Google OAuth & Credentials with BCrypt hashing).
- Comprehensive KYC completion workflow ensuring regulatory compliance before issuing Pix accounts.

---

## 📦 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend & SSR** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons |
| **Authentication** | NextAuth.js v4, BCrypt.js |
| **Backend & APIs** | Next.js API Routes, TypeScript 5, Node.js 20+ |
| **Database & ORM** | PostgreSQL 15, Prisma ORM 6 (Strict Migrations, Composite Indexes) |
| **Queue & Cache** | Redis 7, BullMQ |
| **Banking Gateway** | StarkBank SDK (Dynamic Invoices, Pix Keys, Transfers) |
| **Infrastructure** | Docker, Docker Compose (Multi-container setup: Web, Worker, DB, Redis) |

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) v20+ & npm

### 1. Clone & Configure Environment

```bash
git clone https://github.com/GustavoTravnik/PayHub.git
cd PayHub
cp .env.example .env
```

Ensure your `.env` contains:
```env
DATABASE_URL="postgresql://payhub:payhub_password@localhost:5432/payhub_db?schema=public"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-secure-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# StarkBank Sandbox/Production Credentials
STARKBANK_PROJECT_ID="your-project-id"
STARKBANK_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----"
STARKBANK_ENVIRONMENT="sandbox"
```

### 2. Run with Docker Compose (Recommended)

Start the entire distributed architecture (Postgres, Redis, Next.js Web App, and Background Worker) with a single command:

```bash
docker compose up --build
```

The services will be available at:
- **Web App & Dashboard:** [http://localhost:3000](http://localhost:3000)
- **PostgreSQL Database:** `localhost:5432`
- **Redis Instance:** `localhost:6379`

### 3. Running Locally for Development

```bash
# 1. Install dependencies
npm install

# 2. Run Prisma migrations
npx prisma migrate dev

# 3. Start development server
npm run dev

# 4. In a separate terminal, start the background worker
npm run worker:dev
```

---

## 🧪 Testing & Verification Scripts

The repository includes dedicated automated verification scripts under `scripts/`:

```bash
# Test Pix key formatting and document validation logic
npx tsx scripts/test-pix-validation.ts

# Test database persistence, relational integrity, and cascade operations
npx tsx scripts/test-database-persistence.ts

# Generate new StarkBank ECDSA public/private keys
npx tsx scripts/generate-stark-keys.ts
```

---

## 🔒 Security & Best Practices

- **Idempotency:** Transactions are guarded against duplicate processing using unique constraint checks on `starkBankInvoiceId`.
- **Database Indexing:** Strategic composite indexes on `userId`, `status`, and `createdAt` for high-throughput transactional queries.
- **Environment Isolation:** Clean segregation between Sandbox and Production banking environments.

---

## 👨‍💻 Author

**Gustavo Reis Rocha Pitta Travnik**  
- GitHub: [@GustavoTravnik](https://github.com/GustavoTravnik)  
- Email: gustavotravnik@outlook.com
