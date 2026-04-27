# Testing Guide

## Run Tests

```bash
npm test
```

## Test Suites

| Suite | File | Tests |
|---|---|---|
| Unit — P&L math | `tests/unit/finance.utils.test.js` | 8 |
| Integration — trade flow | `tests/integration/trade.flow.test.js` | 3 |

## Unit Tests

Prove the weighted-average cost formula, `calcTotalCost`, and `calcProceeds` with four cost-basis scenarios and precision checks. No database or HTTP involved — pure function testing.

**Scenarios covered:**
- First buy (no prior holding)
- Second buy at a higher price
- Second buy at a lower price
- Large quantity imbalance

## Integration Tests

Runs three HTTP requests against the live Express app (Prisma client mocked):

1. First buy → asserts `totalCost`
2. Second buy with existing holding → asserts `holding.update` was called with the correct weighted `avgCost = 3000.0000`
3. `GET /holdings` → asserts `totalInvested = 45000.00`

The integration test validates the full request → controller → service → (mocked) DB path without spinning up a real database.
