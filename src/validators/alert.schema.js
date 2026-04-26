import { z } from 'zod';

export const createAlertSchema = z.object({
  symbol:     z.string().min(1, 'Symbol is required').toUpperCase(),
  kind:       z.enum(['ABOVE', 'BELOW']),
  price:      z.number().positive('Alert price must be a positive value'),
  webhookUrl: z.string().url('webhookUrl must be a valid URL'),
});
