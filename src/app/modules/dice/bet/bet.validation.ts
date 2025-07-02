import { z } from 'zod';

export const betValidationSchema = z.object({
  body: z.object({
    userAddress: z.string().min(1),
    userName: z.string().min(1),
    gameName: z.string().min(1),
    betAmount: z.number().positive(),
    rollTarget: z.number().min(0.01).max(99.99),
    clientSeed: z.string().min(1),
    nonce: z.number().int().nonnegative(),
    condition: z.enum(['over', 'under']),
  }),
});

export const BetValidationSchemas = { betValidationSchema };
