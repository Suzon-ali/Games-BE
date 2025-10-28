import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { generateNewSeed } from '../fairness/seed.controller';
import { IBet } from '../../dice/bet/bet.interface';
import config from '../../../config';
import { redis } from '../../../lib/redis';
import AppError from '../../../error/AppError';
import { getUserCache } from '../../../../utils/getUserCache';
import { BetModel } from '../../dice/bet/bet.model';
import { User } from '../../User/user.model';
import { io } from '../../../socket';

const HOUSE_EDGE = 0.01;

// Helper to generate Limbo multiplier (1.00 to ~1,000,000)
function generateLimboMultiplier(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
) {
  const HOUSE_EDGE = 0.01; // 1%

  const hash = crypto
    .createHmac('sha256', serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest('hex');

  // Convert hash → integer
  const int = parseInt(hash.substring(0, 13), 16);
  const div = Math.pow(2, 52);

  const r = int / div; // uniform random number in [0, 1)

  // Limbo formula:
  const multiplier = Math.floor((100 * (1 - HOUSE_EDGE)) / (1 - r)) / 100;

  // Cap at 1,000,000x
  return Math.min(multiplier, 1_000_000);
}

const placeLimboBet = async (data: IBet, authUser: JwtPayload) => {
  const userId = authUser?.userId;
  const userKey = `user:${userId}`;
  const lockKey = `lock:${userId}`;
  const maxBetAmount = Number(config.max_bet ?? 1000);
  const minBetAmount = Number(config.min_bet ?? 0.01);

  const { nextServerSeed, nextServerSeedHash } = generateNewSeed();

  // Lock to prevent bet spam
  const lock = await redis.set(lockKey, '1', 'PX', 150, 'NX');
  if (!lock) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Please slow down', '');
  }

  // Get user cache
  let { serverSeed, serverSeedHash } = await getUserCache(userId);
  const { balance, nonce } = await getUserCache(userId);
  const { amount, targetMultiplier, client_secret } = data;
  let betAmount = amount / 10000;

  // Validation
  if (balance < betAmount)
    throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient balance', '');
  if (betAmount > maxBetAmount) betAmount = maxBetAmount;
  if (betAmount < minBetAmount)
    throw new AppError(StatusCodes.BAD_REQUEST, 'Bet is less than min', '');

  // Ensure seeds
  if (!serverSeed) serverSeed = crypto.randomBytes(32).toString('hex');
  if (!serverSeedHash)
    serverSeedHash = crypto
      .createHash('sha256')
      .update(serverSeed)
      .digest('hex');

  // Generate Limbo result
  const multiplier = generateLimboMultiplier(serverSeed, client_secret, nonce);

  // Check win/loss
  const isWin = multiplier >= targetMultiplier!;
  const payoutMultiplier = isWin ? targetMultiplier! * (1 - HOUSE_EDGE) : 0;
  const profit = isWin ? betAmount * (payoutMultiplier - 1) : -betAmount;
  const payoutToThePlayer = isWin ? betAmount + profit : 0;
  const newBalance = balance - betAmount + payoutToThePlayer;

  // Save bet details
  const betData = {
    userId,
    userName: authUser?.userName,
    gameName: 'Limbo',
    previousBalance: balance,
    endingBalance: newBalance,
    amount: betAmount,
    targetMultiplier,
    client_secret,
    nonce,
    serverSeed,
    serverSeedHash,
    result: {
      multiplier: isWin? targetMultiplier : 0.00,
      isWin,
      profit,
      payoutToThePlayer,
      multiplier_hit: multiplier,
    },
  };

  // Update Redis
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

  // Save to DB and broadcast updates
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

      const pub = redis.multi();
      pub.publish(
        `user:bet:placed:${userId}`,
        JSON.stringify({
          betId: bet._id.toString(),
          result: { multiplier, isWin },
          userId,
          gameName: bet?.gameName,
          userName: authUser?.userName,
        }),
      );
      pub.publish(
        'latestBets',
        JSON.stringify({
          userName: authUser?.userName,
          betId: bet._id.toString(),
          amount: bet.amount,
          gameName: 'Limbo',
          createdAt: bet.createdAt,
          result: {
            multiplier: isWin? targetMultiplier : 0.00,
            isWin,
            profit,
            payoutMultiplier,
            payoutToThePlayer,
          },

        }),
      );
      pub.publish(
        `wallet:update:${userId}`,
        JSON.stringify({ userId, balance: newBalance }),
      );
      await pub.exec();
    } catch (err) {
      console.error('Error saving Limbo bet:', err);
    }
  });

  const betResponse = {
    balance: {
      formatted: `${(newBalance * 10000).toFixed(0)} USD`,
      currency: 'USD',
      amount: parseFloat((newBalance * 10000).toFixed(0)),
    },
    bet: {
      hash: serverSeedHash,
      nonce,
      targetMultiplier,
      client_secret,
      result: {
        type: isWin ? 'win' : 'lose',
        multiplier: isWin? targetMultiplier : 0.00,
        winnings: parseFloat((payoutToThePlayer * 10000).toFixed(0)),
        multiplier_hit: multiplier,
      },
    },
    next_hash: nextServerSeedHash,
  };

  if (io && userId) io.to(userId).emit('limbo:placeBet', betResponse);

  return { success: true, bet: betResponse };
};

export const LimboBetServices = {
  placeLimboBet,
};
