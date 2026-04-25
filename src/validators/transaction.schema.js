import { z } from 'zod';

export const buyStockSchema = z.object({
  symbol: z.string().toUpperCase().min(1, "Company is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  price: z.number().positive("Price must be a positive value")
});

export const sellStockSchema = z.object({
  symbol: z.string().toUpperCase().min(1, "Symbol is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  price: z.number().positive("Selling price must be a positive value")
});