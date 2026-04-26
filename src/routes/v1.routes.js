import { Router } from 'express';
import { createPortfolio, addFunds, getPortfolioDetails } from '../controllers/portfolio.controller.js';
import { buyStock, sellStock } from '../controllers/transaction.controller.js';
import { createAlert } from '../controllers/alert.controller.js';

const router = Router();

/**
 * @openapi
 * /v1/portfolios:
 *   post:
 *     tags:
 *       - Portfolio
 *     summary: Create a new portfolio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientName, riskProfile]
 *             properties:
 *               clientName:
 *                 type: string
 *                 example: "Hari Dev"
 *               riskProfile:
 *                 type: string
 *                 enum: [CONSERVATIVE, MODERATE, AGGRESSIVE]
 *                 example: MODERATE
 *     responses:
 *       201:
 *         description: Portfolio created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Portfolio'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/portfolios', createPortfolio);

/**
 * @openapi
 * /v1/portfolios/{id}/balance:
 *   post:
 *     tags:
 *       - Portfolio
 *     summary: Add funds to a portfolio
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Portfolio ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Funds added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Funds added successfully"
 *                 newBalance:
 *                   type: number
 *                   example: 10000
 *       400:
 *         description: Validation error (amount must be positive)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Portfolio not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Portfolio ID does not exist"
 */
router.post('/portfolios/:id/balance', addFunds);

/**
 * @openapi
 * /v1/portfolios/{id}:
 *   get:
 *     tags:
 *       - Portfolio
 *     summary: Get portfolio details with holdings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Portfolio ID
 *     responses:
 *       200:
 *         description: Portfolio details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     portfolioId:
 *                       type: string
 *                       format: uuid
 *                     clientName:
 *                       type: string
 *                     riskProfile:
 *                       type: string
 *                       enum: [CONSERVATIVE, MODERATE, AGGRESSIVE]
 *                     cashBalance:
 *                       type: number
 *                     holdings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Holding'
 *       404:
 *         description: Portfolio not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/portfolios/:id', getPortfolioDetails);

/**
 * @openapi
 * /v1/portfolios/{id}/buy:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Buy a stock
 *     description: >
 *       Purchases a stock for the portfolio. The submitted `price` must be within
 *       ±0.5% of the current market price (slippage protection). Deducts total cost
 *       from cash balance and updates holdings with a weighted average cost.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Portfolio ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol, quantity, price]
 *             properties:
 *               symbol:
 *                 type: string
 *                 example: "AAPL"
 *               quantity:
 *                 type: integer
 *                 example: 10
 *               price:
 *                 type: number
 *                 description: Must be within ±0.5% of the current market price
 *                 example: 175.50
 *     responses:
 *       201:
 *         description: Stock purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Stock purchased successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     symbol:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     totalCost:
 *                       type: string
 *                       example: "1755.00"
 *       400:
 *         description: Insufficient funds or price outside slippage tolerance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               insufficient_funds:
 *                 summary: Insufficient cash balance
 *                 value:
 *                   success: false
 *                   error: "Insufficient cash balance to complete this trade"
 *               price_slippage:
 *                 summary: Price slippage exceeded
 *                 value:
 *                   success: false
 *                   error: "Order rejected: submitted price deviates more than 0.5% from the current market price"
 *       404:
 *         description: Stock symbol not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/portfolios/:id/buy', buyStock);

/**
 * @openapi
 * /v1/portfolios/{id}/sell:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Sell a stock
 *     description: >
 *       Sells a stock from the portfolio. The submitted `price` must be within
 *       ±0.5% of the current market price (slippage protection). Adds proceeds
 *       to cash balance and reduces or removes the holding.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Portfolio ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol, quantity, price]
 *             properties:
 *               symbol:
 *                 type: string
 *                 example: "AAPL"
 *               quantity:
 *                 type: integer
 *                 example: 5
 *               price:
 *                 type: number
 *                 description: Must be within ±0.5% of the current market price
 *                 example: 175.50
 *     responses:
 *       200:
 *         description: Stock sold successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successfully sold AAPL"
 *                 data:
 *                   type: object
 *                   properties:
 *                     symbol:
 *                       type: string
 *                     quantitySold:
 *                       type: integer
 *                     proceeds:
 *                       type: string
 *                       example: "877.50"
 *       400:
 *         description: Insufficient holdings or price outside slippage tolerance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               insufficient_holdings:
 *                 summary: Not enough stock to sell
 *                 value:
 *                   success: false
 *                   error: "You do not have enough quantity of this stock to sell."
 *               price_slippage:
 *                 summary: Price slippage exceeded
 *                 value:
 *                   success: false
 *                   error: "Order rejected: submitted price deviates more than 0.5% from the current market price"
 *       404:
 *         description: Stock symbol not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/portfolios/:id/sell', sellStock);

/**
 * @openapi
 * /v1/portfolios/{id}/alerts:
 *   post:
 *     tags:
 *       - Alerts
 *     summary: Create a price alert
 *     description: >
 *       Creates a price alert for a symbol in this portfolio. A background job polls
 *       every 30 seconds and POSTs to the webhookUrl when the condition fires.
 *       Each alert fires at most once, then becomes INACTIVE.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Portfolio ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol, kind, price, webhookUrl]
 *             properties:
 *               symbol:
 *                 type: string
 *                 example: "AAPL"
 *               kind:
 *                 type: string
 *                 enum: [ABOVE, BELOW]
 *                 example: ABOVE
 *               price:
 *                 type: number
 *                 description: The price threshold that triggers the alert
 *                 example: 180.00
 *               webhookUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL that receives a POST when the alert fires
 *                 example: "https://webhook.site/your-unique-id"
 *     responses:
 *       201:
 *         description: Alert created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Alert created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     symbol:
 *                       type: string
 *                     kind:
 *                       type: string
 *                       enum: [ABOVE, BELOW]
 *                     price:
 *                       type: number
 *                     webhookUrl:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *                     portfolioId:
 *                       type: string
 *                       format: uuid
 *       400:
 *         description: Validation error (invalid kind, missing fields, bad URL)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Portfolio or symbol not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/portfolios/:id/alerts', createAlert);

export default router;
