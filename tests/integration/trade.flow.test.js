import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Decimal } from 'decimal.js';

// vi.hoisted ensures these vi.fn() instances exist before vi.mock() runs (ESM hoisting requirement)
const {
  mockTransaction,
  mockCompanyFindUnique,
  mockPortfolioFindUnique,
  mockPortfolioUpdate,
  mockHoldingFindUnique,
  mockHoldingFindMany,
  mockHoldingCreate,
  mockHoldingUpdate,
} = vi.hoisted(() => ({
  mockTransaction:        vi.fn(),
  mockCompanyFindUnique:  vi.fn(),
  mockPortfolioFindUnique: vi.fn(),
  mockPortfolioUpdate:    vi.fn(),
  mockHoldingFindUnique:  vi.fn(),
  mockHoldingFindMany:    vi.fn(),
  mockHoldingCreate:      vi.fn(),
  mockHoldingUpdate:      vi.fn(),
}));

// Replace the entire Prisma module — prevents real DB connection on import
vi.mock('../../src/config/db.js', () => ({
  default: {
    $transaction:  mockTransaction,
    company:  { findUnique: mockCompanyFindUnique },
    portfolio: { findUnique: mockPortfolioFindUnique, update: mockPortfolioUpdate, create: vi.fn() },
    holding:  { findUnique: mockHoldingFindUnique, findMany: mockHoldingFindMany, create: mockHoldingCreate, update: mockHoldingUpdate, delete: vi.fn() },
  },
}));

// Import app AFTER vi.mock() so all downstream imports get the mock
const { default: app } = await import('../../src/app.js');

const PORTFOLIO_ID = '74646615-3698-46a7-9625-c1293fdb91e7';

// $transaction calls its callback with the mocked prisma as the tx client
const setupTransaction = () => {
  mockTransaction.mockImplementation(async (fn) =>
    fn({
      company:  { findUnique: mockCompanyFindUnique },
      portfolio: { findUnique: mockPortfolioFindUnique, update: mockPortfolioUpdate },
      holding:  { findUnique: mockHoldingFindUnique, create: mockHoldingCreate, update: mockHoldingUpdate, delete: vi.fn() },
    })
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  setupTransaction();
});

describe('Trade flow — buy → holdings (integration)', () => {

  it('1. First buy: 10 shares @ 2950 → totalCost = 29500', async () => {
    // Market price 2950.45 — 2950 is within ±0.5%
    mockCompanyFindUnique.mockResolvedValue({ symbol: 'RELIANCE', price: '2950.45' });
    mockPortfolioFindUnique.mockResolvedValue({ id: PORTFOLIO_ID, cashBalance: '100000' });
    mockHoldingFindUnique.mockResolvedValue(null); // no existing holding
    mockHoldingCreate.mockResolvedValue({});
    mockPortfolioUpdate.mockResolvedValue({});

    const res = await request(app)
      .post(`/v1/portfolios/${PORTFOLIO_ID}/transactions/buy`)
      .send({ symbol: 'RELIANCE', quantity: 10, price: 2950 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.symbol).toBe('RELIANCE');
    expect(res.body.data.quantity).toBe(10);
    expect(res.body.data.totalCost).toBe('29500');
  });

  it('2. Second buy: 5 shares @ 3100 → weighted avgCost = 3000.0000', async () => {
    // Simulate state after first buy: existing holding of 10 @ 2950
    // Market price 3100 — 3100 is within ±0.5% of 3100
    mockCompanyFindUnique.mockResolvedValue({ symbol: 'RELIANCE', price: '3100' });
    mockPortfolioFindUnique.mockResolvedValue({ id: PORTFOLIO_ID, cashBalance: '70500' });
    mockHoldingFindUnique.mockResolvedValue({
      id: 'holding-1',
      symbol: 'RELIANCE',
      quantity: '10',
      avgCost: '2950',
    });
    mockHoldingUpdate.mockResolvedValue({});
    mockPortfolioUpdate.mockResolvedValue({});

    const res = await request(app)
      .post(`/v1/portfolios/${PORTFOLIO_ID}/transactions/buy`)
      .send({ symbol: 'RELIANCE', quantity: 5, price: 3100 });

    expect(res.status).toBe(201);
    expect(res.body.data.totalCost).toBe('15500');

    // Core assertion: the weighted average cost passed to the DB must be correct
    // (10×2950 + 5×3100) / 15 = 45000/15 = 3000.0000
    const updateArgs = mockHoldingUpdate.mock.calls[0][0];
    expect(new Decimal(updateArgs.data.avgCost.toString()).toFixed(4)).toBe('3000.0000');
    expect(updateArgs.data.quantity).toBe(15);
  });

  it('3. GET /holdings → totalInvested = 45000.00 (quantity 15 × avgCost 3000)', async () => {
    // Simulate final state: 15 shares @ avgCost 3000
    mockPortfolioFindUnique.mockResolvedValue({ id: PORTFOLIO_ID });
    mockHoldingFindMany.mockResolvedValue([
      { symbol: 'RELIANCE', quantity: '15', avgCost: '3000' },
    ]);

    const res = await request(app).get(`/v1/portfolios/${PORTFOLIO_ID}/holdings`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.portfolioId).toBe(PORTFOLIO_ID);

    const holding = res.body.data.holdings[0];
    expect(holding.symbol).toBe('RELIANCE');
    expect(holding.quantity).toBe('15');
    expect(holding.totalInvested).toBe('45000.00');
  });

});
