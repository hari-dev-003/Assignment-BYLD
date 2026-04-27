# BYLD Wealth — Backend Intern Assignment

**Submitted by:** Hari Dev  
**Role:** Backend Developer Intern  
**Cohort:** CSE+ (3rd year) — Knowledge Institute of Technology, Salem  
**Variant:** C — Price Alerts

---

## Language Declaration

> The assignment specifies Java 17+ / Spring Boot 3.x. The FAQ states: *"What if I only know Python / Node? You can use Python (FastAPI) or Node (NestJS/Express) — but tell us upfront in the README."*
>
> This submission uses **Node.js 18 + Express 5** with **Prisma ORM** and **PostgreSQL 14**. All evaluation criteria — money math, migrations, error handling, tests, reproducibility — are met on the same rubric.

| Spring Boot | This project |
|---|---|
| `@RestControllerAdvice` | `errorHandler` middleware (Express) |
| Flyway migrations | Prisma Migrate (versioned SQL migrations) |
| `@Scheduled` | `setInterval` poller (`src/jobs/alertPoller.js`) |
| Testcontainers | Vitest + Supertest with mocked Prisma |
| `BigDecimal` | `Decimal.js` |
| MDC `X-Request-Id` | `logger` middleware stamps every request |

---

## Quick Start — One Command

```bash
docker compose up
```

Starts PostgreSQL 14, runs Prisma migrations, seeds 20 companies, and starts the server on port `3000`.

**Swagger UI:** [http://localhost:3000/swagger-ui](http://localhost:3000/swagger-ui)

> No manual DB setup required. Do not run any SQL or `prisma migrate` commands before `docker compose up`.

---

## Auth

No authentication required. All endpoints are open (per assignment spec: *"Leave it open or use a dev-only bearer token — document in README"*).

---

## Project Timeline

| Date | Activity |
|---|---|
| Apr 24, 3:00–5:00 pm | Read assignment PDF, scope analysis, designed system architecture |
| Apr 24, 6:00–7:00 pm | Scaffolded project structure, tested sample route, set up PostgreSQL + Docker |
| Apr 25, 3:00–7:00 pm | Core endpoints: `POST /portfolios`, `POST /balance`, `GET /portfolio`, buy/sell logic |
| Apr 25, +1.5 hrs | Debugging — ESM issues, Prisma transaction edge cases |
| Apr 25, +1.0 hr | Variant C — price alert system and 30s poller |
| Apr 26, 4:00–5:00 pm | Unit + integration tests |
| Apr 26, 7:00–8:30 pm | README and AI_LOG.md |

**Total: ~12 hours across 3 days (within the 8–12 hour budget).**

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

## API Endpoints

Base URL: `http://localhost:3000`

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/portfolios` | Create a new portfolio |
| `GET` | `/v1/portfolios/:id` | Portfolio summary with cash balance + holdings |
| `POST` | `/v1/portfolios/:id/balance` | Deposit funds |
| `GET` | `/v1/portfolios/:id/holdings` | Holdings with weighted-average cost basis |
| `POST` | `/v1/portfolios/:id/transactions/buy` | Buy stock (slippage protected) |
| `POST` | `/v1/portfolios/:id/transactions/sell` | Sell stock — rejects oversell with 409 |
| `POST` | `/v1/portfolios/:id/alerts` | Create price alert with webhook (Variant C) |

Full request/response docs: [Swagger UI](http://localhost:3000/swagger-ui) or [`docs/api_test_report.md`](docs/api_test_report.md).

---

## Project Structure

```
src/
  config/         — Prisma client, Swagger config
  controllers/    — HTTP handlers (portfolio, transaction, alert)
  jobs/           — alertPoller.js (setInterval scheduler)
  middleware/     — logger (X-Request-Id), errorHandler
  routes/         — v1.routes.js (all routes + Swagger JSDoc)
  services/       — business logic
  utils/          — finance.js (pure money-math functions)
  validators/     — Zod schemas
prisma/
  schema.prisma   — data model
  migrations/     — versioned SQL (equivalent to Flyway V1)
  seed.js         — 20 companies seeded on startup
tests/
  unit/           — finance.utils.test.js
  integration/    — trade.flow.test.js
docs/             — detailed documentation (see below)
```

---

## Environment Variables

Copy `.env.example` for local development outside Docker:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/byld` |
| `PORT` | Port the server listens on | `3000` |

> When running via `docker compose up`, environment variables are injected automatically.

---

## Documentation

| File | Contents |
|---|---|
| [`docs/DESIGN.md`](docs/DESIGN.md) | Key design decisions, spec deviations, what I'd do with 2 more days |
| [`docs/TESTING.md`](docs/TESTING.md) | Test suite overview and how to run |
| [`docs/ALERTS.md`](docs/ALERTS.md) | Variant C — alert system and webhook.site testing guide |
| [`docs/api_test_report.md`](docs/api_test_report.md) | Full API reference with request/response examples |
| [`AI_LOG.md`](AI_LOG.md) | AI tool usage, significant prompts, bugs, and design choices |
