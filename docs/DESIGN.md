# Design Decisions, Deviations & Roadmap

## Key Design Decisions

### Money Math
All prices and quantities are stored as `NUMERIC(19,4)` in Postgres. Every calculation uses `Decimal.js` — no native JS floats touch monetary values. The weighted-average cost formula is extracted into `src/utils/finance.js` as a pure function so it can be unit-tested independently of the database.

### Weighted Average Cost Basis
On every BUY, the holding's average cost is recalculated using:
```
newAvgCost = ((oldQty × oldAvg) + (newQty × newPrice)) / (oldQty + newQty)
```
Proven in unit tests across four scenarios: first buy, price above average, price below average, large quantity imbalance.

### Price Slippage Protection (±0.5%)
Every buy and sell validates that the submitted price falls within ±0.5% of the current market price stored in the `Company` table. Orders outside this band are rejected with `400`. The check uses `Decimal.js` comparisons — no floating-point errors.

### Alert Poller — Fire-Once Guarantee
The poller marks alerts `INACTIVE` in the database **before** sending the webhook. If the HTTP call fails or hangs, the alert will not fire a second time. Intentional ordering: durability over guaranteed delivery.

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
Every request is stamped with an `X-Request-Id` (read from the incoming header or generated as a UUID). The ID is logged on every request line and echoed back in the response header so clients can trace their request.

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

#### 1. Real-time market price feed
Currently the `Company` table holds **static seed prices**. With 2 more days I would integrate a live price feed (Zerodha Kite Connect WebSocket or NSE India market data API). The poller would fetch real-time LTP for each symbol instead of reading from the DB, making the alert system genuinely useful. This also removes the static price dependency from slippage validation.

#### 2. Transaction history endpoint
The `Transaction` table is written on every buy/sell but there is no `GET /v1/portfolios/:id/transactions` endpoint. Useful for audit trails and P&L reporting.

#### 3. Real integration tests against a live DB
Replace mocked Prisma integration tests with a real PostgreSQL container (the `testcontainers` npm package exists for Node). This would catch any Prisma schema/query mismatch that mocks silently hide.

#### 4. Alert poller — reliability upgrades
The current poller fires every 30 seconds with `setInterval`. Under load, if `evaluateAlerts()` takes longer than 30s, ticks overlap. Fix: use `setTimeout` recursively and add a DB-level advisory lock so multiple server instances don't double-fire the same alert.

#### 5. Webhook delivery reliability
Failed webhooks are currently logged and dropped. For production, failed deliveries should be queued for retry with exponential backoff (3 attempts, then dead-letter) — a `deliveryStatus` column on the Alert row with a separate retry poller.
