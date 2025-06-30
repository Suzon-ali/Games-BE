import { Schema, model } from 'mongoose';
import { IBet } from './bet.interface';

const BetSchema = new Schema<IBet>(
  {
    userAddress: { type: String, required: true },
    betAmount: { type: Number, required: true },
    rollOver: { type: Number, required: true },
    clientSeed: { type: String, required: true },
    nonce: { type: Number, required: true },
    serverSeed: { type: String, required: true },
    serverSeedHash: { type: String, required: true },
    result: {
      resultNumber: Number,
      isWin: Boolean,
      payout: Number,
      profit: Number,
      multiplier: String,         
      payoutToThePlayer: String, 
    },
  },
  { timestamps: true }
);

export const BetModel = model<IBet>('Bet', BetSchema);
