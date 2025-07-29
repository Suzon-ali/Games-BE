// src/modules/fairness/seed.controller.ts
import crypto from 'crypto';
import { Request, Response } from 'express';
import sendResponse from '../../../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';

export const nextServerSeed = crypto.randomBytes(32).toString('hex');
export const nextServerSeedHash = crypto
  .createHash('sha256')
  .update(nextServerSeed)
  .digest('hex');

export const getNextSeedHash = async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bets fetched succesfully!',
    data: { nextServerSeedHash },
  });
};



