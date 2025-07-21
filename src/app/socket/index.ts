/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import cookie from 'cookie';
import { redisSubscriber } from '../lib/redis';

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

  // 🔐 Authentication middleware
  io.use((socket, next) => {
    let token = socket.handshake.auth?.token;
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
      const decoded = jwt.verify(
        token,
        config.jwt_access_secret as string,
      ) as JwtPayload;

      (socket as any).user = decoded;
      return next();
    } catch (err: any) {
      console.log('❌ Invalid token, connecting as guest:', err.message);
      return next();
    }
  });

  // 🎧 Socket connection
  io.on('connection', (socket: Socket) => {
    const authUser = (socket as any).user || null;
    console.log(`📡 Client connected: ${socket.id}`);
    console.log('👤 Authenticated User:', authUser || 'Guest');

    socket.on('join', (userId: string) => {
      if (userId) {
        socket.join(userId);
        console.log(`✅ User ${userId} joined room`);
      } else {
        console.log("⚠️ 'join' event called without userId");
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // 🔔 Redis pub/sub listeners
  redisSubscriber.subscribe('latestBets', (err, count) => {
    if (err) {
      console.error('❌ Redis subscription error:', err);
    } else {
      console.log(`📨 Subscribed to 'latestBets' (${count} channels)`);
    }
  });

  redisSubscriber.on('message', (channel, message) => {
    try {
      const parsed = JSON.parse(message);

      if (channel === 'latestBets') {
        io.emit('latestBets', parsed);
      }
    } catch (err) {
      console.error('❌ Error parsing Redis message:', err);
    }
  });

  redisSubscriber.psubscribe('wallet:update:*', (err, count) => {
    if (err) {
      console.error('Redis psubscribe error:', err);
    } else {
      console.log(`📨 Subscribed to 'walletUpdate' (${count} channels)`);
    }
  });

  redisSubscriber.on('pmessage', (pattern, channel, message) => {
    const parsed = JSON.parse(message);

    if (pattern === 'wallet:update:*' && parsed?.userId) {
      io.to(parsed.userId).emit('wallet:update', parsed);
    }
  });


  redisSubscriber.psubscribe('user:bet:placed:*', (err, count) => {
    if (err) {
      console.error('Redis psubscribe error:', err);
    } else {
      console.log(`📨 Subscribed to 'user:bet:placed:*' (${count} channels)`);
    }
  });
  
  redisSubscriber.on('pmessage', (pattern, channel, message) => {
    const parsed = JSON.parse(message);
    const userId = parsed?.userId;
  
    if (userId) {
      io.to(userId).emit("bet:placed", parsed);
    }
  });
  
};
