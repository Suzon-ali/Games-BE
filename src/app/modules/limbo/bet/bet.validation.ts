import { z } from "zod";

const limboBetValidationSchema = z.object({
  body: z.object({
    amount: z
      .number()
      .positive({ message: "Amount must be a positive number" }),
    targetMultiplier: z
      .number()
      .min(1.01, { message: "Target multiplier must be at least 1.01" })
      .max(9900, { message: "Target multiplier must not exceed 9900" }),
    client_secret: z
      .string()
      .min(1, { message: "Client secret is required" }),
  }),
});

export const LimboBetValidationSchemas = { limboBetValidationSchema };
