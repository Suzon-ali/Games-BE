/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { BetServices } from '../modules/dice/bet/bet.service';
import config from '../config';
import cookie  from 'cookie';


export let io: Server;

export const initSocketServer = (server: HTTPServer): void => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://games-client-fqmo.vercel.app',
        'https://games-client-production.up.railway.app',
        'http://192.168.0.183:3000',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  console.log('🚀 Socket.IO server initialized');

  io.use((socket, next) => {
    const rawCookie = socket?.request?.headers?.cookie || '';
    const cookies = cookie.parse(rawCookie); // ✅ Now cookies is an object

    const token = cookies.accessToken;

    console.log({ cookies });

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
    } catch (err: any) {
      console.log('❌ JWT Verification Failed:', err.message);
      return next(new Error('Invalid token'));
    }
  });

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
