import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import AppError from '../../error/AppError';
import { User } from '../User/user.model';
import { sendEmail } from '../../../utils/sendMail';
import { IUserLogin } from './auth.interface';
import createToken from './auth.utils';
import { redis } from '../../lib/redis';

const loginUserIntoDB = async (payload: IUserLogin) => {
  const user = await User.isUserExistsByEmail(payload?.email);
  const userKey = `user:${user?._id}`;

  // Check if user exists
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User is not found', '');
  }

  // Check if user is blocked (using status)
  if (user.status === 'banned' || user.status === 'suspended') {
    throw new AppError(StatusCodes.FORBIDDEN, 'User is blocked', '');
  }

  // Check if password matches
  if (
    !(await User.isPasswordMatched(payload?.password, user?.password as string))
  ) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Wrong password', '');
  }

  // Use first role or array as roles (depending on your usage)
  const jwtPayload = {
    email: user.email,
    roles: user.roles, // array of roles
    userId: user._id,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );
  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string,
  );

  const pipeline = redis.pipeline();
  pipeline.hmset(userKey, {
    balance: user.balance,
    nonce: user.nonce,
  });
  pipeline.expire(userKey, 5);
  await pipeline.exec();

  return {
    userInfo: {
      _id: user._id,
      email: user.email,
      userName: user.userName,
      balance: user.balance,
      bonusBalance: user.bonusBalance,
      bonusEligible: user.bonusEligible,
      roles: user.roles,
      status: user.status,
      kycStatus: user.kycStatus,
      vipLevel: user.vipLevel,
      isTestUser: user.isTestUser,
      nonce: user.nonce,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  const decoded = jwt.verify(
    token,
    config.jwt_refresh_secret as string,
  ) as JwtPayload & { userId?: string };

  const { userId } = decoded;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token', '');
  }

  const user = await User.isUserExistsById(userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User is not found', '');
  }

  if (user.status === 'banned' || user.status === 'suspended') {
    throw new AppError(StatusCodes.FORBIDDEN, 'User is blocked', '');
  }

  const jwtPayload = {
    email: user.email,
    roles: user.roles,
    userId: user._id,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  return {
    accessToken,
  };
};

const forgetPassword = async (email: string) => {
  const user = await User.isUserExistsByEmail(email);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User is not found', '');
  }

  if (user.status === 'banned' || user.status === 'suspended') {
    throw new AppError(StatusCodes.FORBIDDEN, 'User is blocked', '');
  }

  const jwtPayload = {
    email: user.email,
    roles: user.roles,
    userId: user._id,
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    '10m',
  );

  const resetUiLink = `${config.reset_password_ui_link}?email=${email}&token=${resetToken}`;
  await sendEmail(email, resetUiLink);
};

const resetePassword = async (accessToken: string, password: string) => {
  const decoded = jwt.verify(
    accessToken,
    config.jwt_access_secret as string,
  ) as JwtPayload & { email?: string };

  const { email } = decoded;

  if (!email) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token payload', '');
  }

  const user = await User.isUserExistsByEmail(email);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User is not found', '');
  }

  if (user.status === 'banned' || user.status === 'suspended') {
    throw new AppError(StatusCodes.FORBIDDEN, 'User is blocked', '');
  }

  const newHashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const result = await User.findOneAndUpdate(
    { email: user.email },
    { password: newHashedPassword, passwordChangedAt: new Date() },
    { new: true },
  );

  return result;
};

export const AuthServices = {
  loginUserIntoDB,
  refreshToken,
  forgetPassword,
  resetePassword,
};
