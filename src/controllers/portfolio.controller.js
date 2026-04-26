import { portfolioService, getPortfolioSummary, getHoldings } from '../services/portfolio.service.js';
import { createPortfolioSchema, addBalanceSchema } from '../validators/portfolio.schema.js';

const createPortfolio = async (req, res, next) => {
  try {
    const validated = createPortfolioSchema.parse(req.body);
    const portfolio = await portfolioService.create(validated);
    res.status(201).json(portfolio);
  } catch (error) {
    next(error);
  }
};

const addFunds = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = addBalanceSchema.parse(req.body);
    const updated = await portfolioService.deposit(id, amount);
    
    res.status(200).json({
      message: "Funds added successfully",
      newBalance: updated.cashBalance
    });
  } catch (err) {
    if (err.message === 'PORTFOLIO_NOT_FOUND') {
      return res.status(404).json({ error: "Portfolio ID does not exist" });
    }
    next(err);
  }
};

 const getPortfolioDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const data = await getPortfolioSummary(id);

    return res.status(200).json({
      success: true,
      data: {
        portfolioId: data.id,
        clientName: data.clientName,
        riskProfile: data.riskProfile,
        cashBalance: data.cashBalance,
        holdings: data.holdings.map(h => ({
          symbol: h.symbol,
          quantity: h.quantity,
          averageCost: h.avgCost,
          // Total cost basis for this specific asset
          totalInvested: (Number(h.quantity) * Number(h.avgCost)).toFixed(2)
        }))
      }
    });
  } catch (error) {
    if (error.message === 'PORTFOLIO_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "Portfolio not found" });
    }
    next(error);
  }
};

const getPortfolioHoldings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const holdings = await getHoldings(id);

    return res.status(200).json({
      success: true,
      data: { portfolioId: id, holdings },
    });
  } catch (error) {
    if (error.message === 'PORTFOLIO_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Portfolio not found' });
    }
    next(error);
  }
};

export { createPortfolio, addFunds, getPortfolioDetails, getPortfolioHoldings };