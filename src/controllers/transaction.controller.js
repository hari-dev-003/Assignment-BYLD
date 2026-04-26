import { transactionService } from '../services/transaction.service.js';
import { buyStockSchema,sellStockSchema } from '../validators/transaction.schema.js';

const buyStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = buyStockSchema.parse(req.body);

    const result = await transactionService.executeBuy(id, validatedData);

    return res.status(201).json({
      success: true,
      message: "Stock purchased successfully",
      data: result
    })

  } catch (error) {
    if (error.message === 'INSUFFICIENT_FUNDS') {
      return res.status(400).json({ 
        success: false, 
        error: "Insufficient cash balance to complete this trade" 
      });
    }
    if (error.message === 'COMPANY_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: "The stock symbol provided does not exist in our market"
      });
    }
    if (error.message === 'PRICE_SLIPPAGE_EXCEEDED') {
      return res.status(400).json({
        success: false,
        error: "Order rejected: submitted price deviates more than 0.5% from the current market price"
      });
    }
    next(error);
  }
};

const sellStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = sellStockSchema.parse(req.body);

    const result = await transactionService.executeSell(id, validatedData);

    return res.status(200).json({
      success: true,
      message: `Successfully sold ${result.symbol}`,
      data: result
    });
  } catch (error) {
    if (error.message === 'INSUFFICIENT_HOLDINGS') {
      return res.status(400).json({
        success: false,
        error: "You do not have enough quantity of this stock to sell."
      });
    }
    if (error.message === 'COMPANY_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: "The stock symbol provided does not exist in our market"
      });
    }
    if (error.message === 'PRICE_SLIPPAGE_EXCEEDED') {
      return res.status(400).json({
        success: false,
        error: "Order rejected: submitted price deviates more than 0.5% from the current market price"
      });
    }
    next(error);
  }
};

export { buyStock,sellStock }