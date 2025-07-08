import { Request, Response } from 'express';
import catchAsync from '../../../../utils/catchAsync';
import sendResponse from '../../../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { BetServices } from './bet.service';
import { calculateHash, getRollFromHash } from '../../../../utils/provablyFair';
import { JwtPayload } from 'jsonwebtoken';


const handleBet = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as JwtPayload;
  const bet = req?.body;
  const result = await BetServices.placeBet(bet, authUser);
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

const verifyBet = async (req: Request, res: Response) => {
  const { clientSeed, serverSeed, nonce } = req.body;

  if (!clientSeed || !serverSeed || nonce === undefined) {
    res.status(400).json({ error: 'Missing parameters' });
    // Use return on its own to stop execution
    return;
  }

  try {
    const hash = calculateHash(clientSeed, serverSeed, nonce);
    const rolledNumber = getRollFromHash(hash);
    // This part is already correct (no "return")
    res.status(200).json({
      success:true,
      verified: true,
      rolledNumber,
      hash,
    });
  } catch (error) {
    // It's better to let an error-handling middleware manage this
    console.error('Error during hash calculation or roll:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

const getMyBets = catchAsync(async(req: Request, res: Response) =>{
  const userId = req?.user?.userId;
  const query = req.query;
  const result = await BetServices.getMyBetsFromDB(userId , query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Bets fetched succesfully!',
    data: result,
  });
}
)

export const BetControllers = { handleBet, verifyBet, getAllBets, getMyBets };
