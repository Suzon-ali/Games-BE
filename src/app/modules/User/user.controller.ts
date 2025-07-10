import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { v4 as uuidv4 } from 'uuid';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { UserServices } from './user.service';


const createUser = catchAsync(async (req: Request, res: Response) => {
  const paylod = req.body;
  const user = { ...paylod, id: uuidv4() };
  const result = await UserServices.createUserIntoDB(user);

  const { refreshToken, accessToken } = result;

  res.cookie("refreshToken", refreshToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    success: true,
    message: 'User created succesfully!',
    statusCode: StatusCodes.CREATED,
    data: {
      token: accessToken,
    },
  });
});

const getMyBalance = catchAsync(async (req: Request, res: Response) => {
  const userId = req?.user?.userId;
  const result = await UserServices.getMyBalanceFromDB(userId);
  sendResponse(res, {
    success: true,
    message: 'Balance fetched!',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export const UserControllers = {
  createUser,
  getMyBalance
};
