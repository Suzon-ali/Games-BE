/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';

import AppError from '../error/AppError';
import catchAsync from '../../utils/catchAsync';
import { UserRole } from '../modules/User/user.interface';
import { User } from '../modules/User/user.model';
import config from '../config';

interface AuthRequest extends Request {
  user?: JwtPayload & { email: string; roles: UserRole[] };
}

const auth = (...requiredUserRoles: UserRole[]) => {
  return catchAsync(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const authHeader = req.headers['authorization'];

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          'Access token missing or invalid',
          '',
        );
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', '');
      }

      let decoded: JwtPayload & { email?: string };

      try {
        decoded = jwt.verify(
          token,
          config.jwt_access_secret as string,
        ) as JwtPayload & { email?: string };
      } catch (err: any) {
        throw new AppError(StatusCodes.UNAUTHORIZED, err, '');
      }

      if (!decoded.email) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          'Invalid token payload',
          '',
        );
      }

      const user = await User.isUserExistsByEmail(decoded.email);

      if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User is not found!', '');
      }

      // Check user status (assuming banned or suspended means blocked)
      if (user.status === 'banned' || user.status === 'suspended') {
        throw new AppError(StatusCodes.FORBIDDEN, 'User is banned!', '');
      }

      // Check roles — user.roles is array
      if (requiredUserRoles.length > 0) {
        const hasRole = user.roles!.some((role) =>
          requiredUserRoles.includes(role as UserRole),
        );
        if (!hasRole) {
          throw new AppError(
            StatusCodes.UNAUTHORIZED,
            'Unauthorized: insufficient role',
            '',
          );
        }
      }

      // Attach user to request object (safe info)
      req.user = {
        email: user.email,
        roles: user.roles as UserRole[],
        userId: user._id!.toString(),
        userName: user.userName,
        status: user.status,
      };

      next();
    },
  );
};

export default auth;
