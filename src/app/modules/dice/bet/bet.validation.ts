import { z } from "zod";


export const betValidationSchema = z.object({
  body: z.object({
    amount: z.number().positive({ message: 'Amount must be a positive number' }),
    prediction: z.number()
      .min(0.01, { message: 'Prediction must be at least 0.01' })
      .max(99.99, { message: 'Prediction must be at most 99.99' }),
    client_secret: z.string().min(1, { message: 'Client secret is required' }),
    type: z.enum(['over', 'under'], { required_error: 'Type must be over or under' }),
  }),
});


export const BetValidationSchemas = { betValidationSchema };
