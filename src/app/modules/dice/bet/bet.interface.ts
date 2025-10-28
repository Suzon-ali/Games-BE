import { Types } from 'mongoose';

export interface IBet {
  userId: Types.ObjectId; // Reference to User
  userName: string;
  gameName: string;
  previousBalance: number;
  endingBalance: number;
  amount: number;
  prediction?: number;
  client_secret: string;
  nonce: number;
  serverSeed?: string;
  serverSeedHash?: string;
  prevServerSeed?: string;
  type?: 'over' | 'under';
  targetMultiplier?: number;
  createdAt: string;
  updatedAt: string;
  result: {
    resultNumber?: number;
    rollNumber?: number;
    isWin: boolean;
    payout: number;
    profit: number;
    multiplier: number;
    payoutToThePlayer: number;
    multiplier_hit?: number;
  };
}

interface IBalance {
  formatted: string;
  currency: string;
  amount: number;
}

interface IPrediction {
  type: 'over' | 'under';
  amount: number;
}

interface IResult {
  type: 'win' | 'lose' | 'draw';
  value: number;
  winnings: number;
}

interface IBetResponse {
  hash: string; // like "4c66fa03-7b4a-4b6e-bd70-ebdabc3526e8"
  nonce: number; // e.g., 781
  prediction: IPrediction; // prediction object
  client_secret: string; // string
  server_secret: string; // string
  result: IResult; // result object
  created_at: string; // ISO date string
}

export interface IFullBetResponse {
  success: boolean;
  data: {
    balance: IBalance;
    bet: IBetResponse;
    next_hash: string;
  };
}
