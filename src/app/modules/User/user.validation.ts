
import { z } from 'zod';

// Roles, status, and KYC enums
const UserRoleEnum = z.enum(['user', 'vip', 'affiliate', 'admin', 'support']);
const UserStatusEnum = z.enum(['active', 'banned', 'suspended']);
const KYCStatusEnum = z.enum(['none', 'pending', 'verified', 'rejected']);

// ✅ Schema for creating a new user (registration or admin)
export const UserCreateSchema = z.object({
  body: z.object({
    _id: z.string().optional(),
    email: z
      .string({ required_error: 'Email is required' })
      .email({ message: 'Invalid email format' }),
    userName: z
      .string({ required_error: 'Username is required' })
      .min(4, 'Username must be at least 4 characters'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    roles: z.array(UserRoleEnum).default(['user']).optional(),
    status: UserStatusEnum.default('active').optional(),
    kycStatus: KYCStatusEnum.default('none').optional(),

    balance: z.number().min(0).default(0).optional(),
    bonusBalance: z.number().min(0).default(0).optional(),
    vipLevel: z.number().min(0).default(0).optional(),
    bonusEligible: z.boolean().default(true).optional(),

    serverSeed: z
      .string({ required_error: 'Server seed is required' })
      .optional(),
    serverSeedHash: z
      .string({ required_error: 'Server seed hash is required' })
      .optional(),
    nonce: z.number().default(0).optional(),
    clientSeed: z
      .string({ required_error: 'Client seed is required' })
      .optional(),

    isTestUser: z.boolean().default(false).optional(),
  }),
});

// ✅ Schema for updating a user
export const UserUpdateSchema = UserCreateSchema.partial();

// ✅ Optional: Validation for ID-based actions (e.g., fetch or delete)
export const UserIdParamSchema = z.object({
  id: z.string({ required_error: 'User ID is required' }),
});

// ✅ Group exports
export const UserValidationSchemas = {
  UserCreateSchema,
  UserUpdateSchema,
  UserIdParamSchema,
};
