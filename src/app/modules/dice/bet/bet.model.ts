import { Schema, Types, model } from 'mongoose';
import { IBet } from './bet.interface';

const BetSchema = new Schema<IBet>(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: { type: String },
    gameName: { type: String },
    previousBalance: { type: Number, min: 0 },
    endingBalance: { type: Number, min: 0 },
    amount: { type: Number, required: true },
    prediction: { type: Number, required: true },
    client_secret: { type: String, required: true },
    nonce: { type: Number, required: true },
    serverSeed: { type: String, required: true },
    serverSeedHash: { type: String, required: true },
    type: {
      type: String,
      enum: ['over', 'under'],
      required: true,
    },
    result: {
      resultNumber: Number,
      rollNumber: Number,
      isWin: Boolean,
      payout: Number,
      profit: Number,
      multiplier: Number,
      payoutToThePlayer: Number,
    },
  },
  { timestamps: true },
);

export const BetModel = model<IBet>('Bet', BetSchema);
