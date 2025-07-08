import { z } from 'zod';

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string({ required_error: 'Password is required!' }),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required!' }),
  }),
});

const forgetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email format' }),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z.object({
    password: z
      .string({
        message: 'Password must be string',
        required_error: 'Password is required',
      })
      .min(4, { message: 'Minimum 4 charecters' }),
  }),
});

export const AuthValidationSchemas = {
  loginValidationSchema,
  refreshTokenValidationSchema,
  forgetPasswordValidationSchema,
  resetPasswordValidationSchema,
};
