import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { ChatServices } from './chat.service';
import { JwtPayload } from 'jsonwebtoken';

const createChatMessage = catchAsync(async (req: Request, res: Response) => {
  const authUser = req.user as JwtPayload;
  const message = req?.body?.message;

  const result = await ChatServices.createChatIntoDB(authUser, message);

  sendResponse(res, {
    success: true,
    message: 'Chat created successfully!',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const getAllChats = catchAsync(async (req: Request, res: Response) => {
  const result = await ChatServices.getAllChatsFromDB(req?.query);

  sendResponse(res, {
    success: true,
    message: 'Chat fetched successfully!',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export const ChatControllers = { createChatMessage, getAllChats };
