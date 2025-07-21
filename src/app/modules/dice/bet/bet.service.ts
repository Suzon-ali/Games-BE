/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';
import { getRollFromSeed } from '../../../../utils/provablyFair';
import QueryBuilder from '../../../builder/QueryBuilder';
import AppError from '../../../error/AppError';
import { User } from '../../User/user.model';
import { betSearchFields } from './bet.constant';
import { BetModel } from './bet.model';
//import { io } from '../../../socket';
import { IBet } from './bet.interface';
import { nextServerSeedHash } from '../fairness/seed.controller';
import { Types } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';
import { redis } from '../../../lib/redis';
import { getUserCache } from '../../../../utils/getUserCache';
import { io } from '../../../socket';
//import { io } from '../../../socket';

const HOUSE_EDGE = 0.01;

// export const placeBet = async (data: IBet, authUser: JwtPayload) => {
//   console.time('placeBet');

//   try {
//     const { amount, prediction, client_secret, type } = data;

//     console.time('fetchUser');
//     const user = await User.findById(authUser?.userId);
//     console.timeEnd('fetchUser');

//     if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'No user found', '');

//     const betAmount = amount / 10000;

//     if (user.balance! < betAmount) {
//       throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient balance', '');
//     }

//     // --- Generate seeds and hashes
//     const serverSeed = crypto.randomBytes(32).toString('hex');
//     const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');

//     // --- Generate result
//     const rawResult = getRollFromSeed(serverSeed, client_secret, user.nonce!);
//     const rollNumber = rawResult / 100;

//     const isWin = type === 'over' ? rollNumber > prediction : rollNumber < prediction;
//     const chance = type === 'over' ? 1 - prediction : prediction;
//     const payout = parseFloat(((1 / chance) * (1 - HOUSE_EDGE)).toFixed(4));

//     const profit = isWin ? (amount * (payout - 1)) / 10000 : -betAmount;
//     const payoutToPlayer = isWin ? betAmount + profit : 0;
//     const multiplier = isWin ? parseFloat(payout.toFixed(2)) : 0;
//     const newBalance = user.balance! - betAmount + payoutToPlayer;

//     // --- Prepare bet document
//     const betData = {
//       userId: authUser?.userId,
//       userName: user.userName,
//       gameName: 'Dice',
//       previousBalance: user.balance,
//       endingBalance: newBalance,
//       amount: betAmount,
//       prediction: prediction * 100,
//       type,
//       client_secret,
//       nonce: user.nonce,
//       serverSeed,
//       serverSeedHash,
//       result: {
//         resultNumber: rawResult,
//         isWin,
//         payout,
//         profit,
//         multiplier,
//         payoutToThePlayer: payoutToPlayer,
//       },
//     };

//     // --- Write DB updates in parallel
//     console.time('saveToDB');
//     const [bet] = await Promise.all([
//       BetModel.create(betData),
//       User.findByIdAndUpdate(authUser?.userId, {
//         balance: newBalance,
//         nonce: user.nonce! + 1,
//       }),
//     ]);
//     console.timeEnd('saveToDB');

//     // --- Emit real-time updates (non-blocking)
//     setImmediate(() => {
//       io.to(authUser?.userId.toString()).emit('wallet:update', {
//         balance: newBalance,
//       });

//       io.emit('bet:placed', {
//         userName: user.userName,
//         betId: bet._id.toString(),
//         amount: bet?.amount,
//         gameName: bet?.gameName,
//         result: {
//           resultNumber: rawResult,
//           isWin,
//           payout,
//           profit,
//           multiplier,
//           payoutToThePlayer: payoutToPlayer,
//         },
//       });
//     });

//     // --- Return API response
//     console.timeEnd('placeBet');

//     return {
//       success: true,
//       data: {
//         balance: {
//           formatted: `${(newBalance * 10000).toFixed(0)} USD`,
//           currency: 'USD',
//           amount: parseFloat((newBalance * 10000).toFixed(0)),
//         },
//         bet: {
//           hash: serverSeedHash,
//           nonce: user.nonce,
//           prediction: {
//             type,
//             amount: prediction,
//           },
//           client_secret,
//           server_secret: serverSeed,
//           result: {
//             type: isWin ? 'win' : 'lose',
//             value: parseFloat(rollNumber.toFixed(6)),
//             winnings: parseFloat((payoutToPlayer * 10000).toFixed(0)),
//           },
//         },
//         next_hash: nextServerSeedHash,
//       },
//     };
//   } catch (error: any) {
//     console.timeEnd('placeBet');
//     throw new AppError(500, error?.message || 'Bet error', '');
//   }
// };

//placeBet using redis

// export const placeBetDemo = async (data: IBet, authUser: JwtPayload) => {
//   console.time('placeBet');

//   try {
//     const { amount, prediction, client_secret, type } = data;

//     console.time('fetchUser');
//     const user = await User.findById(authUser?.userId);
//     console.timeEnd('fetchUser');

//     if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'No user found', '');

//     const betAmount = amount / 10000;

//     if (user.balance! < betAmount) {
//       throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient balance', '');
//     }

//     // --- Generate seeds and hashes
//     const serverSeed = crypto.randomBytes(32).toString('hex');
//     const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');

//     // --- Generate result
//     const rawResult = getRollFromSeed(serverSeed, client_secret, user.nonce!);
//     const rollNumber = rawResult / 100;

//     const isWin = type === 'over' ? rollNumber > prediction : rollNumber < prediction;
//     const chance = type === 'over' ? 1 - prediction : prediction;
//     const payout = parseFloat(((1 / chance) * (1 - HOUSE_EDGE)).toFixed(4));

//     const profit = isWin ? (amount * (payout - 1)) / 10000 : -betAmount;
//     const payoutToPlayer = isWin ? betAmount + profit : 0;
//     const multiplier = isWin ? parseFloat(payout.toFixed(2)) : 0;
//     const newBalance = user.balance! - betAmount + payoutToPlayer;

//     // --- Prepare bet document
//     const betData = {
//       userId: authUser?.userId,
//       userName: user.userName,
//       gameName: 'Dice',
//       previousBalance: user.balance,
//       endingBalance: newBalance,
//       amount: betAmount,
//       prediction: prediction * 100,
//       type,
//       client_secret,
//       nonce: user.nonce,
//       serverSeed,
//       serverSeedHash,
//       result: {
//         resultNumber: rawResult,
//         isWin,
//         payout,
//         profit,
//         multiplier,
//         payoutToThePlayer: payoutToPlayer,
//       },
//     };

//     // --- Write DB updates in parallel
//     console.time('saveToDB');
//     const [bet] = await Promise.all([
//       BetModel.create(betData),
//       User.findByIdAndUpdate(authUser?.userId, {
//         balance: newBalance,
//         nonce: user.nonce! + 1,
//       }),
//     ]);
//     console.timeEnd('saveToDB');

//     // --- Emit real-time updates (non-blocking)
//     setImmediate(() => {
//       io.to(authUser?.userId.toString()).emit('wallet:update', {
//         balance: newBalance,
//       });

//       io.emit('bet:placed', {
//         userName: user.userName,
//         betId: bet._id.toString(),
//         amount: bet?.amount,
//         gameName: bet?.gameName,
//         result: {
//           resultNumber: rawResult,
//           isWin,
//           payout,
//           profit,
//           multiplier,
//           payoutToThePlayer: payoutToPlayer,
//         },
//       });
//     });

//     // --- Return API response
//     console.timeEnd('placeBet');

//     return {
//       success: true,
//       data: {
//         balance: {
//           formatted: `${(newBalance * 10000).toFixed(0)} USD`,
//           currency: 'USD',
//           amount: parseFloat((newBalance * 10000).toFixed(0)),
//         },
//         bet: {
//           hash: serverSeedHash,
//           nonce: user.nonce,
//           prediction: {
//             type,
//             amount: prediction,
//           },
//           client_secret,
//           server_secret: serverSeed,
//           result: {
//             type: isWin ? 'win' : 'lose',
//             value: parseFloat(rollNumber.toFixed(6)),
//             winnings: parseFloat((payoutToPlayer * 10000).toFixed(0)),
//           },
//         },
//         next_hash: nextServerSeedHash,
//       },
//     };
//   } catch (error: any) {
//     console.timeEnd('placeBet');
//     throw new AppError(500, error?.message || 'Bet error', '');
//   }
// };

const placeBet = async (data: IBet, authUser: JwtPayload) => {
  const userId = authUser?.userId;
  const userKey = `user:${userId}`;
  //const lockKey = `lock:${userId}`;

  //Acquire a short lock to prevent spam (e.g. 500ms)
  // const lock = await redis.set(lockKey, "1", {
  //   NX: true,
  //   PX: 200,
  // });
  
  // if (!lock) throw new AppError(StatusCodes.BAD_REQUEST, 'Please slow down', '');

  // Step 1: Fetch from Redis
  const { balance, nonce } = await getUserCache(userId);
  const { amount, prediction, client_secret, type } = data;
  const betAmount = amount / 10000;

  if (balance < betAmount) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient balance', '');
  }

  // Step 2: Calculate Result
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = crypto
    .createHash('sha256')
    .update(serverSeed)
    .digest('hex');
  const rawResult = getRollFromSeed(serverSeed, client_secret, nonce);
  const rollNumber = rawResult / 100;

  const isWin =
    type === 'over' ? rollNumber > prediction : rollNumber < prediction;
  const chance = type === 'over' ? 1 - prediction : prediction;
  const payout = parseFloat(((1 / chance) * (1 - HOUSE_EDGE)).toFixed(4));

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
    prediction: prediction * 100,
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
      console.error("Error in background task:", err);
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
      server_secret: serverSeed,
      result: {
        type: isWin ? 'win' : 'lose',
        value: parseFloat(rollNumber.toFixed(6)),
        winnings: parseFloat((payoutToPlayer * 10000).toFixed(0)),
      },
    },
    next_hash: nextServerSeedHash,
  }

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
  return result;
};

export const BetServices = { placeBet, getAllBetsFromDB, getMyBetsFromDB };
