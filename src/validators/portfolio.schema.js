import {z} from 'zod';

export const createPortfolioSchema = z.object({
    clientName: z.string().min(1,"Client Name is Required"),
    riskProfile: z.enum(['CONSERVATIVE','MODERATE','AGGRESSIVE'])
})

export const addBalanceSchema = z.object({
    amount: z.number().positive("Amount must be positive")
})