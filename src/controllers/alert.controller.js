import { alertService } from '../services/alert.service.js';
import { createAlertSchema } from '../validators/alert.schema.js';

const createAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = createAlertSchema.parse(req.body);
    const alert = await alertService.createAlert(id, validated);

    return res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: alert,
    });
  } catch (error) {
    if (error.message === 'PORTFOLIO_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Portfolio not found' });
    }
    if (error.message === 'COMPANY_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'The stock symbol provided does not exist in our market' });
    }
    next(error);
  }
};

export { createAlert };
