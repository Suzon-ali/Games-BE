import crypto from 'crypto';
import { BetModel } from './bet.model';
import { IBet } from './bet.interface';
import { getRollFromSeed } from '../../../../utils/provablyFair';
import { broadcastNewBet } from '../../../websocket';
import QueryBuilder from '../../../builder/QueryBuilder';
import { betSearchFields } from './bet.constant';

const HOUSE_EDGE = 0.01;

const placeBet = async (
  data: Omit<IBet, 'serverSeed' | 'serverSeedHash' | 'result'> & {
    condition: 'over' | 'under'; // 🔁 Add condition
  },
) => {
  const {
    userAddress,
    betAmount,
    rollTarget,
    clientSeed,
    nonce,
    userName,
    gameName,
    condition,
  } = data;

  // 1. Generate serverSeed & hash
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = crypto
    .createHash('sha256')
    .update(serverSeed)
    .digest('hex');
  const clientSeedHex = Buffer.from(clientSeed, 'utf8').toString('hex');

  // 2. Generate provably fair roll
  const resultNumber = getRollFromSeed(serverSeed, clientSeedHex, nonce);

  // 3. Calculate win/loss
  const isWin =
    condition === 'over'
      ? resultNumber >= rollTarget
      : resultNumber < rollTarget;

  const chance = condition === 'over' ? 100 - rollTarget : rollTarget;
  const payout = parseFloat(((100 / chance) * (1 - HOUSE_EDGE)).toFixed(2));
  const profit = Number(isWin ? betAmount * (payout - 1) : -betAmount);
  const payoutToThePlayer = parseFloat((betAmount + profit).toFixed(2));
  const multiplier =
    betAmount === 0
      ? 0
      : parseFloat((payoutToThePlayer / betAmount).toFixed(2));

  // 4. Store full bet data
  const bet = await BetModel.create({
    userName,
    gameName,
    userAddress,
    betAmount,
    rollTarget,
    clientSeed,
    nonce,
    serverSeed,
    serverSeedHash,
    condition, // 🆕 Save condition
    result: {
      resultNumber,
      isWin,
      payout,
      profit,
      multiplier,
      payoutToThePlayer,
    },
  });

  broadcastNewBet(bet);

  return bet;
};

const getAllBetsFromDB = async (query: Record<string, unknown>) => {
  const bookQuery = new QueryBuilder(BetModel.find().populate('userName'), query)
    .search(betSearchFields.betSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await bookQuery.modelQuery;
  return result;
};

export const BetServices = { placeBet, getAllBetsFromDB };
