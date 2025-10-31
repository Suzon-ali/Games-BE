/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { getUserCache } from '../../../../utils/getUserCache';
import { getRollFromSeed } from '../../../../utils/provablyFair';
import QueryBuilder from '../../../builder/QueryBuilder';
import config from '../../../config';
import AppError from '../../../error/AppError';
import { redis } from '../../../lib/redis';
import { io } from '../../../socket';
import { User } from '../../User/user.model';
import { generateNewSeed } from '../fairness/seed.controller';
import { betSearchFields } from './bet.constant';
import { IBet } from './bet.interface';
import { BetModel } from './bet.model';

const HOUSE_EDGE = 0.01;

const placeBet = async (data: IBet, authUser: JwtPayload) => {
  const userId = authUser?.userId;
  const userKey = `user:${userId}`;
  const lockKey = `lock:${userId}`;
  const maxBetAmount = config.max_bet ?? 1000;
  const minBetAmount = config.min_bet ?? 0.01;
  const { nextServerSeed, nextServerSeedHash } = generateNewSeed();

  // Acquire a short lock to prevent spam (e.g. 150ms)
  const lock = await redis.set(lockKey, '1', 'PX', 150, 'NX');
  if (!lock) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Please slow down', '');
  }
  console.log(userId ,"here")

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated', '');
  }
  

  // Step 1: Fetch from Redis (single call to avoid race conditions)
  // eslint-disable-next-line prefer-const
  let { balance, nonce, serverSeed, serverSeedHash } = await getUserCache(userId);
  const { amount, prediction, client_secret, type } = data;
  let betAmount: number = amount / 10000;

  if (balance < betAmount) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient balance', '');
  }

  if (betAmount > (maxBetAmount as number)) {
    betAmount = maxBetAmount as number;
  }

  if (betAmount < (minBetAmount as number) && betAmount !== 0) {
    betAmount = minBetAmount as number;
    throw new AppError(StatusCodes.BAD_REQUEST, 'Bet is less than min', '');
  }

  // Step 2: Calculate Result
  if (serverSeed === '') {
    serverSeed = crypto.randomBytes(32).toString('hex');
  }
  if (serverSeedHash === '') {
    serverSeedHash = crypto
      .createHash('sha256')
      .update(serverSeed)
      .digest('hex');
  }

  const rawResult = getRollFromSeed(serverSeed, client_secret, nonce);
  const rollNumber = rawResult / 100;

  const isWin =
    type === 'over' ? rollNumber > prediction! : rollNumber < prediction!;
  const chance = type === 'over' ? 1 - prediction! : prediction;
  const payout = parseFloat(((1 / chance!) * (1 - HOUSE_EDGE)).toFixed(4));

  const profit = isWin ? (amount * (payout - 1)) / 10000 : -betAmount;
  const payoutToPlayer = isWin ? betAmount + profit : 0;
  const multiplier = isWin ? parseFloat(payout.toFixed(2)) : 0;

  const newBalance = balance - betAmount + payoutToPlayer;

  const betData = {
    userId: authUser?.userId,
    userName: authUser?.userName,
    gameName: 'Dice',
    previousBalance: balance,
    endingBalance: newBalance,
    amount: betAmount,
    prediction: prediction! * 100,
    type,
    client_secret,
    nonce: nonce,
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
  };

  // Step 3: Update Redis first
  const pipeline = redis.multi();
  pipeline.hset(
    userKey,
    'balance',
    newBalance.toString(),
    'nonce',
    (nonce + 1).toString(),
    'serverSeed',
    serverSeed,
    'serverSeedHash',
    serverSeedHash,
    'nextServerSeed',
    nextServerSeed,
    'nextServerSeedHash',
    nextServerSeedHash,
  );
  pipeline.expire(userKey, 900);
  await pipeline.exec();

  // Step 4: Save to MongoDB (non-blocking)

  setImmediate(async () => {
    try {
      const [bet] = await Promise.all([
        BetModel.create(betData),
        User.findByIdAndUpdate(userId, {
          balance: newBalance,
          nonce: nonce + 1,
          serverSeed,
          serverSeedHash,
          nextServerSeed,
          nextServerSeedHash,
        }),
      ]);

      // Create a Redis pipeline for all publishes
      const publishPipeline = redis.multi();

      publishPipeline.publish(
        `user:bet:placed:${userId}`,
        JSON.stringify({
          betId: bet._id.toString(), // Ensure bet._id is stringified here too
          result: {
            resultNumber: rawResult,
            isWin,
          },
          gameName: bet?.gameName,
          userId,
          userName: authUser?.userName,
        }),
      );

      publishPipeline.publish(
        'latestBets',
        JSON.stringify({
          userName: authUser?.userName,
          betId: bet._id.toString(),
          amount: bet?.amount,
          gameName: bet?.gameName,
          createdAt: bet?.createdAt,
          result: {
            resultNumber: rawResult,
            isWin,
            payout,
            profit,
            multiplier,
            payoutToThePlayer: payoutToPlayer,
          },
        }),
      );

      publishPipeline.publish(
        `wallet:update:${userId}`,
        JSON.stringify({
          userId,
          balance: newBalance,
        }),
      );
      await publishPipeline.exec(); // Execute all publishes in one go
    } catch (err) {
      console.error('Error in background task:', err);
    }
  });

  const bet = {
    balance: {
      formatted: `${(newBalance * 10000).toFixed(0)} USD`,
      currency: 'USD',
      amount: parseFloat((newBalance * 10000).toFixed(0)),
    },
    bet: {
      hash: serverSeedHash,
      nonce: nonce,
      prediction: {
        type,
        amount: prediction,
      },
      client_secret,
      result: {
        type: isWin ? 'win' : 'lose',
        value: parseFloat(rollNumber.toFixed(6)),
        winnings: parseFloat((payoutToPlayer * 10000).toFixed(0)),
      },
    },
    next_hash: nextServerSeedHash,
  };

  if (io && userId) {
    io.to(userId).emit('dice:placeBet', bet);
  }

  return {
    success: true,
    bet,
  };
};

const getAllBetsFromDB = async (query: Record<string, unknown>) => {
  const betsQuery = new QueryBuilder(BetModel.find().populate('userId'), query)
    .search(betSearchFields.betSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await betsQuery.modelQuery.select('-serverSeed -clientSeed');
  const transformed = result?.map((bet: any) => ({
    userName: bet?.userId?.userName || bet.userName,
    betId: bet?._id?.toString(),
    amount: bet?.amount,
    gameName: bet?.gameName,
    createdAt: bet?.createdAt,
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

const getMyBetsFromDB = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const betsQuery = new QueryBuilder(
    BetModel.find({ userId: new Types.ObjectId(userId) }), // ✅ this is key
    query,
  )
    .search(betSearchFields.betSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await betsQuery.modelQuery;
  const user = await User.findById(userId).select('serverSeedRotatedAt').lean();

  const firstBet = result[0];
  const revealSeed =
    firstBet?.updatedAt && user?.serverSeedRotatedAt
      ? new Date(firstBet.updatedAt) < new Date(user.serverSeedRotatedAt)
      : false;

  if (!revealSeed && firstBet) {
    firstBet.serverSeed = 'notRevealed';
  }
  return result;
};

const rotateServerSeedIntoDB = async (user: JwtPayload) => {
  const id = user.userId;
  const userKey = `user:${id}`;
  const currentUser = await User.findById(id);
  const prevServerSeedHash = currentUser?.serverSeedHash;
  const prevServerSeed = currentUser?.serverSeed;
  if (!currentUser)
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found', '');
  if (currentUser && currentUser.status === 'banned')
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is Banned', '');

  const payload = {
    prevServerSeedHash,
    prevServerSeed,
    serverSeed: currentUser?.nextServerSeed,
    serverSeedHash: currentUser?.nextServerSeedHash,
    nonce: 0,
    serverSeedRotatedAt: new Date().toISOString(),
  };
  const result = await User.findByIdAndUpdate(id, payload, { new: true });
  const pipeline = redis.multi();
  pipeline.hset(userKey, {
    prevServerSeed: currentUser.serverSeed ?? '',
    prevServerSeedHash: currentUser.serverSeedHash ?? '',
    serverSeed: currentUser?.nextServerSeed ?? '',
    serverSeedHash: currentUser?.nextServerSeedHash ?? '',
    nonce: '0',
  });
  pipeline.expire(userKey, 900);
  await pipeline.exec();
  return {
    serverSeedHash: result?.serverSeedHash,
  };
};

const getNextSeedHashFromDB = async (user: JwtPayload) => {
  const id = user.userId;
  const currentUser = await User.findById(id);

  if (!currentUser)
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found', '');

  if (currentUser.status === 'banned')
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is banned', '');

  return {
    nextServerSeedHash: currentUser?.nextServerSeedHash,
  };
};

export const BetServices = {
  placeBet,
  getAllBetsFromDB,
  getMyBetsFromDB,
  rotateServerSeedIntoDB,
  getNextSeedHashFromDB,
};
