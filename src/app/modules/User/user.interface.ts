/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';
export type UserStatus = 'active' | 'banned' | 'suspended';
export type UserRole = 'user' | 'vip' | 'affiliate' | 'admin' | 'support';
export type KYCStatus = 'none' | 'pending' | 'verified' | 'rejected';

// types/User.ts
export interface IUser {
  _id?: Types.ObjectId;
  email: string;
  userName: string;
  roles?: UserRole[];
  status?: UserStatus;
  kycStatus?: KYCStatus;
  password: string;
  balance?: number; 
  bonusBalance?: number; 
  vipLevel?: number;
  bonusEligible?: boolean;
  serverSeed?: string;
  serverSeedHash?: string;
  nonce?: number;
  clientSeed?: string;
  isTestUser?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserModel extends Model<IUser> {
  isUserExistsByEmail(email: string): Promise<IUser | null>;
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
  isUserExistsById(id: string): Promise<IUser | null>;
}
