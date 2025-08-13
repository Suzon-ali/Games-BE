import { StatusCodes } from 'http-status-codes';
import AppError from '../../error/AppError';
import { User } from '../User/user.model';
import ChatModel from './chat.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { chatSearchFields } from './chat.constant';
import { io } from '../../socket';
import { redis } from '../../lib/redis';
import { JwtPayload } from 'jsonwebtoken';

const createChatIntoDB = async (authUser: JwtPayload, message: string) => {
  const userId = authUser.userId;
  const existingUser = await User.isUserExistsById(userId);

  if (!existingUser) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found', '');
  }

  const newMessage = {
    sender: userId,
    senderName: existingUser.userName,
    message,
  };

  try {
    const result = await ChatModel.create(newMessage);
    const senderUser = await User.findById(userId).select('userName');

    const publishPayload = {
      _id: result._id.toString(),
      sender: senderUser?._id.toString() ?? userId,
      senderName: senderUser?.userName ?? existingUser.userName,
      message: result.message,
      createdAt: result.createdAt,
    };

    // Make sure channel name is consistent with subscriber
    await redis.publish('newMessage', JSON.stringify(publishPayload));

    if (io) {
      // This assumes userId corresponds to a socket room or socket id
      io.to(userId).emit('sent:Message', publishPayload);
    }

    return publishPayload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create Chat',
      '',
    );
  }
};


const getAllChatsFromDB = async (query: Record<string, unknown>) => {
  const chatsQuery = new QueryBuilder(ChatModel.find(), query)
    .search(chatSearchFields.chatSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await chatsQuery.modelQuery.exec();
  return result;
};

export const ChatServices = { createChatIntoDB, getAllChatsFromDB };
