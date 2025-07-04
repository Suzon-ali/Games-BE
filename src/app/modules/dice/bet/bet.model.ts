import { Schema, model } from 'mongoose';
import { IBet } from './bet.interface';

const BetSchema = new Schema<IBet>(
  {
    userAddress: { type: String, required: true },
    userName: { type: String, required: true },
    gameName: { type: String, required: true },
    betAmount: { type: Number, required: true },
    rollTarget: { type: Number, required: true },
    clientSeed: { type: String, required: true },
    nonce: { type: Number, required: true },
    serverSeed: { type: String, required: true },
    serverSeedHash: { type: String, required: true },
    condition: {
      type: String,
      enum: ['over', 'under'],
      required: true,
    },
    result: {
      resultNumber: Number,
      isWin: Boolean,
      payout: Number,
      profit: Number,
      multiplier: String,
      payoutToThePlayer: String,
    },
  },
  { timestamps: true },
);

export const BetModel = model<IBet>('Bet', BetSchema);
