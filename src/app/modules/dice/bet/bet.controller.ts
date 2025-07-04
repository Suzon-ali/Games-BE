import { Request, Response } from 'express';
import catchAsync from '../../../../utils/catchAsync';
import sendResponse from '../../../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { BetServices } from './bet.service';
import { BetModel } from './bet.model';
import { getRollFromSeed } from '../../../../utils/provablyFair';

const handleBet = catchAsync(async (req: Request, res: Response) => {
  const bet = req?.body;
  const result = await BetServices.placeBet(bet);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Bet placed succesfully!',
    data: result,
  });
});

const getAllBets = catchAsync(async (req: Request, res: Response) => {
  const result = await BetServices.getAllBetsFromDB(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bets fetched succesfully!',
    data: result,
  });
});

export const verifyBet = async (req: Request, res: Response) => {
  const bet = await BetModel.findById(req.params.betId);

  if (!bet) return res.status(404).json({ message: 'Bet not found' });

  const computedRoll = getRollFromSeed(
    bet.serverSeed,
    bet.clientSeed,
    bet.nonce,
  );

  res.json({
    computedRoll,
    originalRoll: bet.result.resultNumber,
    isMatch:
      parseFloat(computedRoll.toFixed(2)) ===
      parseFloat(bet.result.resultNumber.toFixed(2)),
    bet,
  });
};

export const BetControllers = { handleBet, verifyBet , getAllBets};
