import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../../../../utils/catchAsync';
import sendResponse from '../../../../utils/sendResponse';
import { LimboBetServices } from './bet.service';

const handleLimboBet = catchAsync(async (req: Request, res: Response) => {
  const bet = req?.body;
  const result = await LimboBetServices.placeLimboBet(bet, req.user as JwtPayload);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Bet placed succesfully!',
    data: result,
  });
});

export const LimboBetControllers = {
  handleLimboBet,
};
