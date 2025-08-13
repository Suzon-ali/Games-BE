import { z } from 'zod';

export const chatValidationSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message text is required'),
    imageUrl: z.string().url().optional(),
  }),
});

export const ChatValidationSchemas = { chatValidationSchema };
        