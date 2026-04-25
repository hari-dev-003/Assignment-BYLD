import { Router } from 'express';
import { createPortfolio, addFunds } from '../controllers/portfolio.controller.js';
import { buyStock,sellStock } from '../controllers/transaction.controller.js';
import { getPortfolioDetails } from '../controllers/portfolio.controller.js';

const router = Router();

// Portfolio Inauguration
router.post('/portfolios', createPortfolio);

// Adding Amount to the portfolio
router.post('/portfolios/:id/balance', addFunds);

//Buying Stock
router.post('/portfolios/:id/buy', buyStock);

//Getting portfolio details
router.get('/portfolios/:id', getPortfolioDetails);

router.post('/portfolios/:id/sell', sellStock);
export default router;