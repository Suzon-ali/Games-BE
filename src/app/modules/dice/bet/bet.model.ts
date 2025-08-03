/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, Types, model } from 'mongoose';
import { IBet } from './bet.interface';

const BetSchema = new Schema<IBet>(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    } as any,
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
      resultNumber: { type: Number },
      rollNumber: { type: Number },
      isWin: { type: Boolean },
      payout: { type: Number },
      profit: { type: Number },
      multiplier: { type: Number },
      payoutToThePlayer: { type: Number },
    },
  },
  { timestamps: true },
);

export const BetModel = model<IBet>('Bet', BetSchema);
