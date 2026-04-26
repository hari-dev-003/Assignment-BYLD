import { Decimal } from 'decimal.js';
import prisma from '../config/db.js';
import { calcWeightedAvgCost, calcTotalCost, calcProceeds } from '../utils/finance.js';

export const transactionService = {
  // --- BUY LOGIC ---
  async executeBuy(portfolioId, { symbol, quantity, price }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Verify Company exists
      const company = await tx.company.findUnique({ where: { symbol } });
      if (!company) throw new Error('COMPANY_NOT_FOUND');

      // 1a. Slippage Protection: userPrice must be within ±0.5% of market price
      const marketPrice = new Decimal(company.price.toString());
      const userPrice = new Decimal(price);
      const lowerBound = marketPrice.times(0.995);
      const upperBound = marketPrice.times(1.005);
      if (userPrice.lt(lowerBound) || userPrice.gt(upperBound)) {
        throw new Error('PRICE_SLIPPAGE_EXCEEDED');
      }

      // 2. Check Portfolio and Balance
      const portfolio = await tx.portfolio.findUnique({ where: { id: portfolioId } });
      if (!portfolio) throw new Error('PORTFOLIO_NOT_FOUND');

      const totalCost = calcTotalCost(quantity, price);
      const currentBalance = new Decimal(portfolio.cashBalance.toString());

      if (currentBalance.lt(totalCost)) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      // 3. Update or Create Holding
      const existingHolding = await tx.holding.findUnique({
        where: { portfolioId_symbol: { portfolioId, symbol } },
      });

      if (existingHolding) {
        const newQty = new Decimal(existingHolding.quantity.toString()).plus(new Decimal(quantity.toString()));
        const newAvgCost = calcWeightedAvgCost(existingHolding.quantity, existingHolding.avgCost, quantity, price);

        await tx.holding.update({
          where: { id: existingHolding.id },
          data: { quantity: newQty.toNumber(), avgCost: newAvgCost },
        });
      } else {
        await tx.holding.create({
          data: { portfolioId, symbol, quantity, avgCost: price },
        });
      }

      // 4. Deduct Cash
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: { cashBalance: currentBalance.minus(totalCost) },
      });

      return { symbol, quantity, totalCost: totalCost.toString() };
    });
  },

  // --- SELL LOGIC ---
  async executeSell(portfolioId, { symbol, quantity, price }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Verify Company exists and enforce slippage protection
      const company = await tx.company.findUnique({ where: { symbol } });
      if (!company) throw new Error('COMPANY_NOT_FOUND');

      const marketPrice = new Decimal(company.price.toString());
      const userPrice = new Decimal(price);
      const lowerBound = marketPrice.times(0.995);
      const upperBound = marketPrice.times(1.005);
      if (userPrice.lt(lowerBound) || userPrice.gt(upperBound)) {
        throw new Error('PRICE_SLIPPAGE_EXCEEDED');
      }

      // 2. Verify the user has this stock
      const holding = await tx.holding.findUnique({
        where: { portfolioId_symbol: { portfolioId, symbol } },
      });

      if (!holding || holding.quantity < quantity) {
        throw new Error('INSUFFICIENT_HOLDINGS');
      }

      const sellProceeds = calcProceeds(quantity, price);
      const newQty = new Decimal(holding.quantity.toString()).minus(new Decimal(quantity.toString()));

      // 3. Update Holding: remove entirely if quantity reaches zero
      if (newQty.isZero()) {
        await tx.holding.delete({ where: { id: holding.id } });
      } else {
        await tx.holding.update({
          where: { id: holding.id },
          data: { quantity: newQty.toNumber() },
        });
      }

      // 4. Add proceeds to Cash Balance
      const portfolio = await tx.portfolio.findUnique({ where: { id: portfolioId } });
      if (!portfolio) throw new Error('PORTFOLIO_NOT_FOUND');

      const currentBalance = new Decimal(portfolio.cashBalance.toString());

      await tx.portfolio.update({
        where: { id: portfolioId },
        data: { cashBalance: currentBalance.plus(sellProceeds) },
      });

      return { symbol, quantitySold: quantity, proceeds: sellProceeds.toString() };
    });
  },
};
