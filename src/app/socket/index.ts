// src/app/socket.ts
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { BetServices } from '../modules/dice/bet/bet.service';
import config from '../config';

export let io: Server;

export const initSocketServer = (server: HTTPServer): void => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  console.log('🚀 Socket.IO server initialized');

  // ✅ Auth middleware with full debug
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie || '';
    const token = cookieHeader
      .split('; ')
      .find((c) => c.startsWith('accessToken='))
      ?.split('=')[1];

    if (!token) {
      console.log('⛔ No token found in cookies. Rejecting connection.');
      return next(new Error('No token provided'));
    }

    try {
      const decoded = jwt.verify(
        token,
        config.jwt_access_secret as string,
      ) as JwtPayload;
      console.log('✅ JWT Decoded Payload:', decoded);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      console.log('❌ JWT Verification Failed:', err);
      return next(new Error('Invalid token'));
    }
  });

  // ✅ Event listeners after connection
  io.on('connection', (socket: Socket) => {
    const authUser = (socket as any).user;
    console.log(`📡 Client connected with Socket ID: ${socket.id}`);
    console.log(`👤 Authenticated User:`, authUser);

    socket.on('join', (userId: string) => {
      if (userId) {
        socket.join(userId);
        console.log(`✅ User ${userId} joined room`);
      } else {
        console.log(`⚠️ 'join' event called without userId`);
      }
    });

    socket.on('placeBet', async (data, callback) => {
      try {
        const result = await BetServices.placeBet(data, authUser);

        callback(result);
      } catch (error: any) {
        console.log('❌ Bet placement error:', error.message);
        callback({ success: false, error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
