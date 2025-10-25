/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import cookie from 'cookie';
import config from '../config';

export const applySocketMiddleware = (io: Server) => {
  io.use((socket: Socket, next) => {
    let token = socket.handshake.auth?.token;
    console.log(token,'hand shake')
    if (!token) {
      const rawCookie = socket?.request?.headers?.cookie || '';
      const cookiesParsed = cookie.parse(rawCookie);
      token = cookiesParsed.accessToken;
    }

    if (!token) {
      console.log('👤 Guest socket connected (no token)');
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt_access_secret as string) as JwtPayload;
      (socket as any).user = decoded;
      return next();
    } catch (err: any) {
      console.log('Invalid token, connecting as guest:', err.message);
      return next();
    }
  });
};
