/* eslint-disable @typescript-eslint/no-explicit-any */
import cookie from 'cookie';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import config from '../config';

export const applySocketMiddleware = (io: Server) => {
  io.use((socket: Socket, next) => {
    // Log full handshake data for debugging
    console.log('🔍 Socket handshake data:', {
      auth: socket.handshake.auth,
      headers: socket.request.headers,
      cookies: socket.request.headers.cookie,
      query: socket.handshake.query,
    });

    // Try to get token from auth object first
    let token = socket.handshake.auth?.token;
    console.log('🎫 Token from auth:', token ? 'Found' : 'Not found');

    // If not in auth, try to get from query parameters
    if (!token) {
      token = socket.handshake.query?.token as string;
      console.log('🎫 Token from query:', token ? 'Found' : 'Not found');
    }

    // If still not found, try cookies
    if (!token) {
      const rawCookie = socket?.request?.headers?.cookie || '';
      const cookiesParsed = cookie.parse(rawCookie);
      token = cookiesParsed.accessToken;
      console.log('🎫 Token from cookie:', token ? 'Found' : 'Not found');
    }

    // If still no token, allow connection as guest
    if (!token) {
      console.log('👤 Guest socket connected (no token)');
      return next();
    }

    try {
      const decoded = jwt.verify(
        token,
        config.jwt_access_secret as string,
      ) as JwtPayload;
      (socket as any).user = decoded;
      console.log(
        '✅ Token verified successfully for user:',
        decoded.userId || decoded.id,
      );
      return next();
    } catch (err: any) {
      console.log('❌ Invalid token, connecting as guest:', err.message);
      return next();
    }
  });
};
