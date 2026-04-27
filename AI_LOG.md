# AI_LOG.md

**Developer:** Hari Dev
**Project:** BYLD Wealth — Backend Intern Assignment (Variant C)
**Period:** April 24–27, 2026

---

## Tools Used

- **Claude Code (Anthropic)** — primary tool used throughout the project for planning, implementation, debugging, and documentation
- **Gemini (Google)** — used in early design phase (April 24) for initial scope understanding before switching to Claude Code

---

## Significant Prompts

### Prompt 1 — Initial Scope Understanding
**Prompt (paraphrased):**
> "Here is the assignment PDF. Read it and tell me what I need to build. Explain the scope and what Variant C requires."

**What AI produced:**
A breakdown of the five core endpoints, the Variant C alert system requirements, and a proposed system design with tables and relationships.

**Kept / Rejected:**
Kept the breakdown of endpoints and the understanding of Variant C. **Rejected the AI's proposed system design** — it proposed a more complex architecture with separate transaction and ledger tables that went beyond the scope. I replaced it with the simpler flow I designed myself (see diagram in submission), which maps directly to the assignment's requirements without over-engineering.

---

### Prompt 2 — Database Schema Design
**Prompt (paraphrased):**
> "Based on the workflow I have given you (diagram attached), what tables do I need? Design the Prisma schema for Portfolio, Company, Holding, Transaction, and Alert."

**What AI produced:**
A Prisma schema draft with field types and relationships.

**Kept / Rejected:**
Used AI's output as a reference, not as a final answer. I reviewed each model and made adjustments — for example, confirming that `NUMERIC(19,4)` was the right precision for monetary fields (I cross-checked this against Prisma's decimal docs myself before accepting it). The enum definitions for `Category` and `AlertKind` were also something I verified fit the actual business requirement. AI gave me a starting structure; I read through it, validated it against my workflow diagram, and adjusted field names and constraints to match what I actually wanted.

---

### Prompt 3 — Weighted Average Cost Logic
**Prompt (paraphrased):**
> "Implement the buy stock service. On every buy, if the user already holds the stock, update the weighted average cost using this formula: `((oldQty × oldAvg) + (newQty × newPrice)) / totalQty`. Use Decimal.js for all math."

**What AI produced:**
The `executeBuy` function inside a `prisma.$transaction` block with the weighted average formula implemented using Decimal.js, plus the holding create/update branching logic.

**Kept / Rejected:**
Kept the structure and the Decimal.js usage. Caught and rejected one issue — AI initially used a raw JS comparison (`holding.quantity < quantity`) inside `executeSell` instead of a Decimal comparison. Since `holding.quantity` is a Prisma Decimal object, this native comparison produces incorrect results for certain decimal values. I flagged this and it was corrected.

---

### Prompt 4 — Price Slippage Protection
**Prompt (paraphrased):**
> "Add ±0.5% price slippage protection to buy and sell. Fetch the current market price from the Company table, compute lower and upper bounds, and reject if the user's submitted price is outside that range."

**What AI produced:**
The slippage check using `marketPrice.times(0.995)` and `marketPrice.times(1.005)` with Decimal.js `.lt()` / `.gt()` comparisons, placed inside the `$transaction` block immediately after the company lookup.

**Kept / Rejected:**
Kept fully. This was a well-scoped prompt with a clear requirement — AI produced exactly what was needed. The positioning inside the transaction (before any writes) was the correct design choice.

---

### Prompt 5 — Variant C: Price Alert System
**Prompt (paraphrased):**
> "Plan and implement the Variant C price alert system. POST /portfolios/:id/alerts should create an alert. A background job should poll every 30 seconds and POST to the webhookUrl if the alert fires. Alerts must fire at most once then become INACTIVE."

**What AI produced:**
A full plan followed by implementation: `alert.schema.js` (Zod validation), `alert.service.js` (createAlert + evaluateAlerts), `alert.controller.js`, `alertPoller.js` (setInterval with immediate first tick), and the route + Swagger docs.

**Kept / Rejected:**
Kept the overall structure and the fire-once guarantee (mark INACTIVE before POSTing to webhook). **Rejected the initial suggestion to use `node-cron`** — an earlier AI suggestion mentioned node-cron, but I chose plain `setInterval` instead. node-cron adds a dependency for something that is just a fixed 30-second interval; `setInterval` is built-in and the intent is identical. No reason to pull in a package for this.

---

### Prompt 6 — Test Strategy and Implementation
**Prompt (paraphrased):**
> "The assignment requires unit tests for P&L/cost-basis and at least one integration test. Plan what to test, then implement it. Unit tests should prove the math. The integration test should cover the full buy to holdings flow."

**What AI produced:**
A two-layer test plan: extract pure math into `src/utils/finance.js` and test it with no mocks; run an integration test using `supertest` with mocked Prisma that walks through first buy → second buy → GET holdings and asserts the weighted average cost at each step.

**Kept / Rejected:**
Kept the finance utility extraction — this was the right call. It made the math independently testable and also improved the service code. Kept the integration test structure. **Rejected the initial suggestion to write tests for every endpoint** — the assignment asks only for P&L math unit tests and one integration test. Writing 20+ tests for validation errors and 404 responses would have been wasted time that the rubric does not reward.

---

### Prompt 7 — System Architecture & Database Schema Diagrams
**Prompt (paraphrased):**
> "Generate a project architecture diagram for the README and include the database schema in the design document. Analyse the project deeply first — read the actual source files — then plan both diagrams before implementing."

**What AI produced:**
Before drawing anything, AI read every relevant file: `src/app.js`, `v1.routes.js`, all controllers, all services, `alertPoller.js`, both middleware files, `finance.js`, `prisma/schema.prisma`, and the raw migration SQL in `prisma/migrations/`. From that it produced:

- A **system architecture diagram** showing the full request lifecycle: HTTP client → logger middleware (X-Request-Id) → v1 Router + Zod → three controller/service stacks (Portfolio, Transaction, Alert) → Prisma → PostgreSQL, with `finance.js` as a utility edge off Transaction, the Alert Poller as an independent `setInterval` branch firing webhooks externally, and the errorHandler path back to the client.
- A **database ERD** mapping all five tables (`Portfolio`, `Holding`, `Transaction`, `Alert`, `Company`) with correct column types (`NUMERIC(19,4)` annotated on every monetary field), PK/FK/UK markers, enum value sets, and the three FK relationships (Portfolio → Holding, Transaction, Alert). It also correctly identified that `Company` carries no FK — referenced only by symbol string at the service layer — and flagged the unique constraint on `Holding(portfolioId, symbol)`.
- Both diagrams were embedded as SVG files in `docs/assets/` and referenced in `README.md` and `docs/DESIGN.md` respectively.

**Kept / Rejected:**
Kept fully. The approach of reading every source file before designing the diagrams — rather than inferring from the README — meant both outputs were accurate against the real code: the correct middleware order, the actual 30-second polling interval, the exact column precision, and the Company symbol-string reference pattern confirmed directly from the migration SQL. I reviewed the architecture diagram against the actual request flow and the ERD against the Prisma schema and migration file, and both matched precisely. No corrections were needed.

---

## A Bug AI Introduced

**Bug:** In the initial implementation of `executeSell`, the holdings quantity check was written as:

```js
if (!holding || holding.quantity < quantity) {
  throw new Error('INSUFFICIENT_HOLDINGS');
}
```

`holding.quantity` is a Prisma `Decimal` object (from the `NUMERIC(19,4)` column). Comparing a `Decimal` object with a plain JS number using the native `<` operator does not use Decimal arithmetic — JavaScript coerces both operands, which can produce wrong results for certain decimal values (e.g., `10.0000 < 10` evaluates unexpectedly depending on how Prisma surfaces the value).

**How I caught it:** While reviewing the sell service code after AI generated it, I noticed that every other comparison in the file used Decimal.js methods (`.lt()`, `.gt()`, `.times()`), but this one line used raw `<`. The inconsistency stood out immediately. I flagged it and the service was corrected to use Decimal comparison consistently.

---

## A Design Choice Made Against AI Suggestion

**The situation:** When I first asked AI to propose a system architecture (April 24, design phase), it suggested a more complex design with a separate `Ledger` table to track every cash movement (deposits, trade debits, dividend credits), with the portfolio balance derived by summing the ledger rather than storing it directly — an event-sourcing-style approach.

**Why I rejected it:** The assignment is explicit — *"Intentionally small in surface area, intentionally unforgiving in correctness."* A ledger-based approach is architecturally sound for production but adds significant complexity: every balance read becomes an aggregation query, migrations are harder, and the scope goes well beyond what the rubric rewards. The assignment grades correctness of the math and reproducibility, not architectural sophistication.

**What I did instead:** I designed my own workflow (the diagram submitted with this assignment) — `cashBalance` is a single `NUMERIC(19,4)` column on the `Portfolio` table, updated atomically inside a `prisma.$transaction` on every buy, sell, and deposit. Simple, correct, and directly testable. The AI implemented that design once I provided the flow.

---

## Time Split

AI was involved across all stages of the project timeline — scope analysis, schema design, implementation, debugging, testing, and documentation. Total time spent on AI-related activities: **~3.5 hrs** out of ~12 hrs total.

| AI Activity | Approx. % | Approx. Time |
|---|---|---|
| Writing and refining prompts | 30% | ~1 hr |
| Reviewing AI output line-by-line (reading diffs, checking logic) | 40% | ~1.5 hrs |
| Fixing / rejecting AI-introduced errors | 20% | ~45 mins |
| Documenting AI decisions in this log | 10% | ~15 mins |

The largest share was **reviewing output**, not prompting — because money math and transaction logic require line-by-line verification. A bug here does not cause a crash; it silently produces a wrong balance.
