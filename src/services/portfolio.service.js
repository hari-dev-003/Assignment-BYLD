import { Decimal } from 'decimal.js';
import prisma from '../config/db.js';

export const portfolioService = {
  
  async create(data) {
    return await prisma.portfolio.create({
      data: {
        clientName: data.clientName,
        riskProfile: data.riskProfile,
        cashBalance: new Decimal(0) 
      }
    });
  },

 
  async deposit(id, amount) {
    const portfolio = await prisma.portfolio.findUnique({ where: { id } });
    if (!portfolio) throw new Error('PORTFOLIO_NOT_FOUND');

    const currentBalance = new Decimal(portfolio.cashBalance.toString());
    const depositAmount = new Decimal(amount.toString());
    const newBalance = currentBalance.plus(depositAmount);

    return await prisma.portfolio.update({
      where: { id },
      data: { cashBalance: newBalance }
    });
  }
};

const getPortfolioSummary = async (portfolioId) => {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
      holdings: {
        orderBy: {
          symbol: 'asc' 
        }
      }
    }
  });

  if (!portfolio) throw new Error('PORTFOLIO_NOT_FOUND');
  
  return portfolio;
};

const getHoldings = async (portfolioId) => {
  const portfolio = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
  if (!portfolio) throw new Error('PORTFOLIO_NOT_FOUND');

  const holdings = await prisma.holding.findMany({
    where: { portfolioId },
    orderBy: { symbol: 'asc' },
  });

  return holdings.map((h) => ({
    symbol:        h.symbol,
    quantity:      h.quantity,
    averageCost:   h.avgCost,
    totalInvested: (Number(h.quantity) * Number(h.avgCost)).toFixed(2),
  }));
};

export { getPortfolioSummary, getHoldings };