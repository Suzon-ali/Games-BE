import crypto from 'crypto';
import { BetModel } from './bet.model';
import { IBet } from './bet.interface';
import { getRollFromSeed } from '../../../../utils/provablyFair';

const HOUSE_EDGE = 0.01;

export const placeBet = async (data: Omit<IBet, 'serverSeed' | 'serverSeedHash' | 'result'>) => {
  const { userAddress, betAmount, rollOver, clientSeed, nonce } = data;

  // 1. Generate serverSeed & hash
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
  const clientSeedHex = Buffer.from(clientSeed, 'utf8').toString('hex');


  // 2. Generate provably fair roll
  const resultNumber = getRollFromSeed(serverSeed, clientSeedHex, nonce);

  // 3. Calculate win/loss
  const isWin = resultNumber >= rollOver;
  const chance = 100 - rollOver;
  const payout = parseFloat(((100 / chance) * (1 - HOUSE_EDGE)).toFixed(2));
  const profit = Number(isWin ? betAmount * (payout - 1) : - betAmount);
  const multiplier = parseFloat(((betAmount + profit) / profit).toFixed(2));
  const payoutToThePlayer = parseFloat((betAmount + profit).toFixed(2)); 

  // 4. Store full bet data
  const bet = await BetModel.create({
    userAddress,
    betAmount,
    rollOver,
    clientSeed,
    nonce,
    serverSeed,
    serverSeedHash,
    result: {
      resultNumber,
      isWin,
      payout,
      profit,
      multiplier,
      payoutToThePlayer
    },
  });

  return bet;
};

export const BetServices = { placeBet };
