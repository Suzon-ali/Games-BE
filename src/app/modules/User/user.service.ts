/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from 'http-status-codes';
import AppError from '../../error/AppError';
import { IUser } from './user.interface';
import { User } from './user.model';
import { AuthServices } from '../Auth/auth.service';
import { redis } from '../../lib/redis';
import { BetModel } from '../dice/bet/bet.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { userSearchFields } from './user.constant';

const createUserIntoDB = async (payload: IUser) => {
  try {
    let existingUser = await User.isUserExistsByEmail(payload.email);
    if (!existingUser) {
      existingUser = await User.isUserExistsByUserName(payload.userName);
    }
    if (existingUser) {
      throw new AppError(
        StatusCodes.NOT_ACCEPTABLE,
        'User is already registered',
        '',
      );
    }
    const newUser = new User(payload);
    const result = await newUser.save();

    const userLoginData = await AuthServices.loginUserIntoDB({
      email: result?.email,
      password: payload?.password as string,
    });

    return userLoginData;
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
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid user ID', '');
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

const getUserBetStatsFromDB = async (userName: string) => {
  const userExists = await User.isUserExistsByUserName(userName);
  if (!userExists) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found', '');
  }
  const user = await User.findOne({ userName });

  try {
    const result = await BetModel.aggregate([
      { $match: { userName } },
      {
        $group: {
          _id: '$userName', // Group by userName
          totalBets: { $sum: 1 },
          totalWagered: { $sum: '$amount' },
        },
      },
    ]);

    return {
      userName,
      totalBets: result.length > 0 ? result[0].totalBets : 0,
      totalWagered: result.length > 0 ? result[0].totalWagered : 0,
      createdAt: user?.createdAt,
    };
  } catch (error) {
    console.error('Error fetching user bet stats:', error);
  }
};

const getAllUsersFromDB = async (
  query: Record<string, unknown>,
) => {
  const baseQuery = User.find();

  const userQuery = new QueryBuilder(baseQuery, query)
    .search(userSearchFields.userSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery
    .select(
      '-password -serverSeed -clientSeed -nextServerSeed -nextServerSeedHash -serverSeedHash',
    )
    .lean();

  return result;
};

const getUserByIdFromDB = async (userId: string) => {
  const result = await User.findById(userId)
    .select(
      '-password -serverSeed -clientSeed -nextServerSeed -nextServerSeedHash -serverSeedHash',
    )
    .lean();

  return result;
};

const addCashbackToUser = async (userId: string, amount: number) => {
  const userKey = `user:${userId}`;
  if (amount <= 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Amount must be bigger than 0',
      '',
    );
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { balance: amount } },
    { new: true },
  );

  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'user not found', '');

  // Update redis
  await redis.hset(userKey, {
    balance: user!.balance!.toString(),
  });

  redis.publish(
    `wallet:update:${userId}`,
    JSON.stringify({
      userId,
      balance: user.balance,
    }),
  );

  return { balance: user.balance };
};

export const UserServices = {
  createUserIntoDB,
  getMyBalanceFromDB,
  userLogout,
  getUserBetStatsFromDB,
  getAllUsersFromDB,
  getUserByIdFromDB,
  addCashbackToUser,
};
