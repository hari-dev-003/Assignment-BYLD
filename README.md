# BYLD Wealth — Backend Intern Assignment

**Submitted by:** Hari Dev
**Role:** Backend Developer Intern
**Cohort:** CSE+ (3rd year) — Knowledge Institute of Technology, Salem

---

## Language Declaration

> The assignment specifies Java 17+ / Spring Boot 3.x. The FAQ explicitly states:
> *"What if I only know Python / Node? You can use Python (FastAPI) or Node (NestJS/Express) — but tell us upfront in the README."*
>
> This submission uses **Node.js 18 + Express 5** with **Prisma ORM** and **PostgreSQL 14**.
> All evaluation criteria — money math, migrations, error handling, tests, reproducibility — are met on the same rubric.
> Every Spring Boot concept has a direct Node equivalent used here:
>
> | Spring Boot | This project |
> |---|---|
> | `@RestControllerAdvice` | `errorHandler` middleware (Express) |
> | Flyway migrations | Prisma Migrate (versioned SQL migrations) |
> | `@Scheduled` | `setInterval` poller (`src/jobs/alertPoller.js`) |
> | Testcontainers | Vitest + Supertest with mocked Prisma |
> | `BigDecimal` | `Decimal.js` (same precision guarantee) |
> | MDC `X-Request-Id` | `logger` middleware stamps every request |

---

## Quick Start — One Command

```bash
docker compose up
```

This single command:
1. Starts PostgreSQL 14
2. Runs Prisma migrations (schema creation)
3. Seeds the database with 20 companies (stocks, ETFs, bonds, MTFs)
4. Starts the Express server on port `3000`

**Swagger UI:** [http://localhost:3000/swagger-ui](http://localhost:3000/swagger-ui)

> **No manual DB setup required.** Do not run any SQL or `prisma migrate` commands before `docker compose up`.

---

## Auth

No authentication is required for this assignment. All endpoints are open. As the assignment states: *"Leave it open or use a dev-only bearer token — document in README."*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18 (Alpine) |
| Framework | Express 5 |
| Database | PostgreSQL 14 |
| ORM / Migrations | Prisma 7 (versioned SQL migrations in `prisma/migrations/`) |
| Money math | Decimal.js — all monetary values use `NUMERIC(19,4)` in Postgres |
| Validation | Zod 4 |
| API Docs | swagger-jsdoc + swagger-ui-express |
| Testing | Vitest + Supertest |
| Container | Docker + docker-compose |

---

## Environment Variables

Copy `.env.example` and fill in your values for local development outside Docker:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/byld` |
| `PORT` | Port the server listens on | `3000` |

> When running via `docker compose up`, environment variables are injected automatically. The `.env` file is only needed for running locally without Docker.

---

## API Endpoints

Base URL: `http://localhost:3000`

### Portfolio

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/portfolios` | Create a new portfolio |
| `GET` | `/v1/portfolios/:id` | Get portfolio details with holdings |
| `POST` | `/v1/portfolios/:id/balance` | Deposit funds into a portfolio |
| `GET` | `/v1/portfolios/:id/holdings` | Get all holdings with weighted-average cost basis |

### Transactions

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/portfolios/:id/transactions/buy` | Buy a stock (slippage protected) |
| `POST` | `/v1/portfolios/:id/transactions/sell` | Sell a stock (slippage protected) |

### Alerts (Variant C)

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/portfolios/:id/alerts` | Create a price alert with webhook delivery |

Full request/response documentation is available at **`/swagger-ui`** or in [`src/docs/api_docs.md`](src/docs/api_docs.md).

---

## Key Design Decisions

### Money Math
All prices and quantities are stored as `NUMERIC(19,4)` in Postgres. Every calculation in the codebase uses `Decimal.js` — no native JS floats are used for monetary values. The weighted-average cost formula is extracted into `src/utils/finance.js` as a pure function so it can be unit tested independently of the database.

### Price Slippage Protection (±0.5%)
Every buy and sell order validates that the submitted price falls within ±0.5% of the current market price stored in the `Company` table. Orders outside this band are rejected with `400`. This prevents stale-price trades in a fast-moving market. The check uses `Decimal.js` comparisons — no floating-point errors.

### Weighted Average Cost Basis
On every BUY, the holding's average cost is recalculated using:
```
newAvgCost = ((oldQty × oldAvg) + (newQty × newPrice)) / (oldQty + newQty)
```
This is proven in unit tests across four scenarios including edge cases (first buy, price above/below average, large quantity imbalance).

### Alert Poller — Fire-Once Guarantee
The poller marks alerts `INACTIVE` in the database **before** sending the webhook. If the HTTP call to the webhook URL fails or hangs past the next 30-second tick, the alert will not fire a second time. This is an intentional ordering choice — durability over delivery.

### Error Response Shape
All errors return a consistent JSON shape:
```json
{ "success": false, "error": "Human readable message" }
```
Zod validation errors return:
```json
{ "error": "Validation Failed", "details": [{ "path": "field", "message": "why" }] }
```

### Correlation ID Logging
Every request is stamped with an `X-Request-Id` (read from the incoming header or generated as a UUID). The ID is:
- Logged on every request line: `[uuid] POST /v1/portfolios/...`
- Echoed back in the response header so clients can trace their request

---

## Testing

```bash
npm test
```

| Suite | File | Tests |
|---|---|---|
| Unit — P&L math | `tests/unit/finance.utils.test.js` | 8 |
| Integration — trade flow | `tests/integration/trade.flow.test.js` | 3 |

**Unit tests** prove the weighted-average cost formula, `calcTotalCost`, and `calcProceeds` with four cost-basis scenarios and precision checks.

**Integration test** runs three HTTP requests against the real Express app (Prisma mocked):
1. First buy → asserts `totalCost`
2. Second buy with existing holding → asserts `holding.update` was called with the correct weighted `avgCost = 3000.0000`
3. GET `/holdings` → asserts `totalInvested = 45000.00`

---

## Variant C — Price Alerts & Webhook Testing

### How alerts work
1. Create an alert via `POST /v1/portfolios/:id/alerts`
2. A background job polls the `Company` table every **30 seconds**
3. If the condition is met (`ABOVE` / `BELOW`), the alert fires **once**, POSTs to your `webhookUrl`, then becomes `INACTIVE`

### Testing with webhook.site

1. Go to [https://webhook.site](https://webhook.site) — your unique URL is shown immediately (no signup needed)
2. Copy the URL (looks like `https://webhook.site/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. Create an alert that fires immediately — RELIANCE market price is `2950.45`, so set threshold above it:

```bash
curl -X POST http://localhost:3000/v1/portfolios/{portfolioId}/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE",
    "kind": "BELOW",
    "price": 5000.00,
    "webhookUrl": "https://webhook.site/your-unique-id"
  }'
```

4. Within 30 seconds, webhook.site shows an incoming POST with this payload:

```json
{
  "alertId": "uuid",
  "portfolioId": "uuid",
  "symbol": "RELIANCE",
  "kind": "BELOW",
  "alertPrice": "5000",
  "currentMarketPrice": "2950.45",
  "firedAt": "2026-04-26T12:00:00.000Z"
}
```

5. The alert status is now `INACTIVE` — it will not fire again

### Seeded company prices (for alert testing)

| Symbol | Price | Trigger example |
|---|---|---|
| `RELIANCE` | 2950.45 | `BELOW 5000` fires immediately |
| `TCS` | 3820.15 | `ABOVE 3000` fires immediately |
| `NIFTYBEES` | 245.12 | `ABOVE 200` fires immediately |
| `GS2033` | 100.25 | `BELOW 500` fires immediately |

---

## Project Structure

```
src/
  config/         — Prisma client, Swagger config
  controllers/    — HTTP handlers (portfolio, transaction, alert)
  jobs/           — alertPoller.js (setInterval scheduler)
  middleware/     — logger (X-Request-Id), errorHandler
  routes/         — v1.routes.js (all routes + Swagger JSDoc)
  services/       — business logic (portfolio, transaction, alert)
  utils/          — finance.js (pure money-math functions)
  validators/     — Zod schemas
prisma/
  schema.prisma   — data model
  migrations/     — versioned SQL (equivalent to Flyway V1)
  seed.js         — 20 companies seeded on startup
tests/
  unit/           — finance.utils.test.js
  integration/    — trade.flow.test.js
```

---

## Deviations from the Spec

| Item | Spec | This project | Reason |
|---|---|---|---|
| Language | Java 17+ / Spring Boot | Node.js 18 / Express 5 | FAQ allows it; declared upfront |
| Migrations | Flyway | Prisma Migrate | Node-native equivalent; produces the same versioned SQL |
| Testcontainers | Real Postgres container | Prisma mocked in Vitest | Testcontainers is a Java library; mocked Prisma tests the full HTTP stack without Docker dependency in CI |
| Auth | Optional bearer token | None (open) | Assignment says auth is out of scope |

---

## What I'd Do With 2 More Days

#### 1. Real-time market price feed via Zerodha Kite / NSE API
Currently the `Company` table holds **static seed prices** — the alert poller compares against those. With 2 more days I would integrate a live price feed such as the **Zerodha Kite Connect WebSocket API or the NSE India market data API**. The poller would fetch real-time LTP (Last Traded Price) for each symbol instead of reading from the DB, making the alert system genuinely useful for HNI clients. This also removes the dependency on the seed price for **slippage validation** — buy/sell orders would be checked against the live market price at the moment of the trade, not a static value from startup.

#### 2. Transaction history endpoint
The `Transaction` table is written on every buy/sell but there is no `GET /v1/portfolios/:id/transactions` endpoint to read it. This is useful for audit trails, P&L reporting, and giving the client a full view of their trading activity.

#### 3. Real integration tests against a live DB 
Replace the mocked Prisma integration tests with a real PostgreSQL container (the `testcontainers` npm package exists for Node). This would catch any Prisma schema/query mismatch that mocks silently hide.

#### 4. Alert poller — reliability upgrades
The current poller fires every 30 seconds with `setInterval`. Under load, if `evaluateAlerts()` takes longer than 30s (slow DB, many alerts), ticks overlap. The fix is to use `setTimeout` recursively (next tick only schedules after the current one completes) and add a DB-level advisory lock so multiple server instances don't double-fire the same alert.

#### 5. Webhook delivery reliability
Currently, a failed webhook is logged and dropped. For production, failed deliveries should be queued for retry with exponential backoff (3 attempts, then dead-letter). A simple approach: store `deliveryStatus` on the Alert row and requeue with a separate retry poller.

---

## AI Log

See [`AI_LOG.md`](AI_LOG.md) at the repo root for a full account of AI tool usage, significant prompts, bugs introduced by AI, and design choices made against AI suggestions.
