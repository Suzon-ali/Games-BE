/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';
import { getRollFromSeed } from '../../../../utils/provablyFair';
import QueryBuilder from '../../../builder/QueryBuilder';
import AppError from '../../../error/AppError';
import { User } from '../../User/user.model';
import { betSearchFields } from './bet.constant';
import { BetModel } from './bet.model';
import { io } from '../../../socket';
import { IBet } from './bet.interface';
import { JwtPayload } from 'jsonwebtoken';
import { nextServerSeedHash } from '../fairness/seed.controller';
import { Types } from 'mongoose';

const HOUSE_EDGE = 0.01;

const placeBet = async (data: IBet, authUser: JwtPayload) => {
  try {
    const { amount, prediction, client_secret, type } = data;

    const user = await User.findById(authUser?.userId);
    if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'No user found', '');

    // Check balance
    if (user.balance! < amount / 10000) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient balance', '');
    }

    // --- Generate server seed and hash
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const serverSeedHash = crypto
      .createHash('sha256')
      .update(serverSeed)
      .digest('hex');

    // --- Get raw result (0 - 1 float)
    const rawResult = getRollFromSeed(serverSeed, client_secret, user.nonce!);
    const rollNumber = rawResult / 100; // Full precision (0 - 100 float)
    // --- Win/Loss logic
    const rollTarget = prediction; // prediction should already be in 0–100 range

    const isWin =
      type === 'over' ? rollNumber > rollTarget : rollNumber < rollTarget;

    const chance = type === 'over' ? 1 - rollTarget : rollTarget;
    const payout = parseFloat(((1 / chance) * (1 - HOUSE_EDGE)).toFixed(4));
    const profit = isWin ? (amount * (payout - 1)) / 10000 : -amount / 10000;
    const payoutToPlayer = isWin ? amount / 10000 + profit : 0;
    const multiplier = isWin ? parseFloat(payout.toFixed(2)) : 0;

    const newBalance = user.balance! - amount / 10000 + payoutToPlayer;

    // --- Save bet to DB
    const bet = await BetModel.create({
      userId: authUser?.userId,
      userName: user.userName,
      gameName: 'Dice',
      previousBalance: user.balance,
      endingBalance: newBalance,
      amount: amount / 10000,
      prediction: prediction * 100,
      type,
      client_secret,
      nonce: user.nonce,
      serverSeed,
      serverSeedHash,

      result: {
        resultNumber: rawResult,
        isWin,
        payout,
        profit,
        multiplier,
        payoutToThePlayer: payoutToPlayer,
      },
    });

    // --- Update user's balance and nonce
    await User.findByIdAndUpdate(authUser?.userId, {
      balance: newBalance,
      nonce: user.nonce! + 1,
    });

    // --- Emit real-time events
    io.to(authUser?.userId.toString()).emit('wallet:update', {
      balance: newBalance,
    });
    io.emit('bet:placed', {
      userName: user.userName,
      betId: bet._id.toString(),
      amount: bet?.amount,
      gameName: bet?.gameName,
      result: {
        resultNumber: rawResult,
        isWin,
        payout,
        profit,
        multiplier,
        payoutToThePlayer: payoutToPlayer,
      },
    });

    // --- Return API response
    return {
      success: true,
      data: {
        balance: {
          formatted: `${(newBalance * 10000).toFixed(0)} USD`,
          currency: 'USD',
          amount: parseFloat((newBalance * 10000).toFixed(0)),
        },
        bet: {
          hash: serverSeedHash,
          nonce: user.nonce,
          prediction: {
            type,
            amount: prediction,
          },
          client_secret,
          server_secret: serverSeed,
          result: {
            type: isWin ? 'win' : 'lose',
            value: parseFloat(rollNumber.toFixed(6)),
            winnings: parseFloat((payoutToPlayer * 10000).toFixed(0)),
          },
        },
        next_hash: nextServerSeedHash,
      },
    };
  } catch (error: any) {
    throw new AppError(500, error?.message || 'Bet error', '');
  }
};

const getAllBetsFromDB = async (query: Record<string, unknown>) => {
  const betsQuery = new QueryBuilder(BetModel.find().populate('userId'), query)
    .search(betSearchFields.betSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await betsQuery.modelQuery;
  const transformed = result?.map((bet: any) => ({
    userName: bet?.userId?.userName || bet.userName,
    betId: bet?._id?.toString(),
    amount: bet?.amount,
    gameName: bet?.gameName,
    result: {
      resultNumber: bet.result?.resultNumber,
      isWin: bet.result?.isWin,
      payout: bet.result?.payout,
      profit: bet.result?.profit,
      multiplier: bet.result?.multiplier,
      payoutToThePlayer: bet.result?.payoutToThePlayer,
    },
  }));

  return transformed;
};

const getMyBetsFromDB = async (userId: string, query: Record<string, unknown>) => {
  const betsQuery = new QueryBuilder(
    BetModel.find({ userId: new Types.ObjectId(userId) }), // ✅ this is key
    query
  )
    .search(betSearchFields.betSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await betsQuery.modelQuery;
  return result;
};

export const BetServices = { placeBet, getAllBetsFromDB, getMyBetsFromDB };
