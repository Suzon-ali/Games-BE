/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from 'http-status-codes';
import AppError from '../../error/AppError';
import { IUser } from './user.interface';
import { User } from './user.model';
import { AuthServices } from '../Auth/auth.service';
import { redis } from '../../lib/redis';

const createUserIntoDB = async (payload: IUser) => {
  try {
    const existingUser = await User.isUserExistsByEmail(payload.email);
    if (existingUser) {
      throw new AppError(
        StatusCodes.NOT_ACCEPTABLE,
        'Email is already registered',
        '',
      );
    }
    const newUser = new User(payload);
    const result = await newUser.save();
    
    return await AuthServices.loginUserIntoDB({
      email: result?.email,
      password: payload?.password as string,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // For unknown errors, wrap in a generic AppError
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create user',
      '',
    );
  }
};

const getMyBalanceFromDB = async (userId: string) => {
  try {
    if (!userId) {
      throw new AppError( StatusCodes.UNAUTHORIZED ,'Invalid user ID', '');
    }
    const user = await User.findById(userId).select('balance');
    if (!user) {
      throw new Error('User not found');
    }
    const balance = user?.balance;
    return { balance };
  } catch (error: any) {
    throw new AppError(StatusCodes.BAD_REQUEST, error, '');
  }
};

const userLogout = async (userId: string) => {
  const userKey = `user:${userId}`;
  const result = await redis.del(userKey);
  return result;
};

export const UserServices = {
  createUserIntoDB,
  getMyBalanceFromDB,
  userLogout
};
