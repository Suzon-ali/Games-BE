import { z } from 'zod';

export const betValidationSchema = z.object({
  body: z.object({
    userAddress: z.string().min(1),
    betAmount: z.number().positive(),
    rollOver: z.number().min(0.01).max(99.99),
    clientSeed: z.string().min(1),
    nonce: z.number().int().nonnegative(),
  }),
});

export const BetValidationSchemas = { betValidationSchema };
