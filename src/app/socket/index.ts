/* eslint-disable @typescript-eslint/no-explicit-any */
import cookie from 'cookie';
import { Server as HTTPServer } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import config from '../config';
import { redisSubscriber } from '../lib/redis';
import { ChatServices } from '../modules/Chat/chat.service';
import { BetServices } from '../modules/dice/bet/bet.service';

export let io: Server;

export const initSocketServer = (server: HTTPServer): void => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'https://games-client-fqmo.vercel.app',
        'https://games-client-production.up.railway.app',
        'http://192.168.0.183:3000',
        'https://rolltoday.online',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Improve connection stability
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    // Handle reconnections better
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  console.log('🚀 Socket.IO server initialized');

  // Add connection error handling
  io.engine.on('connection_error', (err) => {
    console.error('❌ Socket.IO connection error:', err);
  });

  // 🔐 Authentication middleware
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token) {
        const rawCookie = socket?.request?.headers?.cookie || '';
        const cookiesParsed = cookie.parse(rawCookie);
        token = cookiesParsed.accessToken;
      }

      if (!token) {
        console.log('👤 Guest socket connected (no token)');
        (socket as any).user = null;
        return next();
      }

      const decoded = jwt.verify(
        token,
        config.jwt_access_secret as string,
      ) as JwtPayload;

      (socket as any).user = decoded;
      console.log(`🔐 Authenticated user: ${decoded.userId || decoded.email}`);
      return next();
    } catch (err: any) {
      console.log('Invalid token, connecting as guest:', err.message);
      (socket as any).user = null;
      return next();
    }
  });

  // 🎧 Socket connection - Single consolidated handler
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    console.log(`📍 Client origin: ${socket.handshake.headers.origin}`);
    console.log(
      `📍 Client user-agent: ${socket.handshake.headers['user-agent']}`,
    );

    // Handle user joining room
    socket.on('join', (userId: string) => {
      try {
        const authUser = (socket as any).user;

        // If userId is provided, use it; otherwise try to get from authenticated user
        const targetUserId = userId || authUser?.userId;

        if (targetUserId) {
          socket.join(targetUserId);
          console.log(
            `✅ User ${targetUserId} joined room (socket: ${socket.id})`,
          );

          // Send confirmation back to client
          socket.emit('joined', {
            success: true,
            userId: targetUserId,
            room: targetUserId,
            socketId: socket.id,
          });

          // Also join a general room for broadcast messages
          socket.join('general');
        } else {
          console.log(
            "⚠️ 'join' event called without userId and no authenticated user",
          );
          socket.emit('joined', {
            success: false,
            error: 'User ID is required',
          });
        }
      } catch (error: any) {
        console.error('❌ Error joining room:', error);
        socket.emit('joined', { success: false, error: error.message });
      }
    });

    // Handle automatic rejoin on reconnection
    socket.on('rejoin', () => {
      const authUser = (socket as any).user;
      if (authUser?.userId) {
        socket.join(authUser.userId);
        socket.join('general');
        console.log(
          `🔄 User ${authUser.userId} rejoined rooms after reconnection`,
        );
        socket.emit('rejoined', { success: true, userId: authUser.userId });
      }
    });

    // Handle dice betting
    socket.on('dice:placeBet', async (payload, callback) => {
      try {
        const authUser = (socket as any).user || null;
        const betData = await BetServices.placeBet(payload, authUser);

        // send result back to the same client
        callback({ success: true, data: { bet: betData } });
      } catch (err: any) {
        console.error('❌ Error placing bet:', err);
        callback({ success: false, error: err.message });
      }
    });

    // Handle chat messages
    socket.on('sent:Message', async (payload, callback) => {
      try {
        const authUser = (socket as any).user || null;
        const message = payload.message;
        const messageData = await ChatServices.createChatIntoDB(
          authUser,
          message,
        );
        // send result back to the same client
        callback({ success: true, data: { message: messageData } });
      } catch (err: any) {
        console.error('❌ Error sending message:', err);
        callback({ success: false, error: err.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);

      // Clean up any user-specific data if needed
      // You can add cleanup logic here
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  // 🔔 Redis pub/sub listeners with better error handling
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
    try {
      const parsed = JSON.parse(message);

      if (pattern === 'wallet:update:*' && parsed?.userId) {
        io.to(parsed.userId).emit('wallet:update', parsed);
      }
    } catch (err) {
      console.error('❌ Error parsing Redis pmessage:', err);
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
    try {
      const parsed = JSON.parse(message);
      const userId = parsed?.userId;

      if (userId) {
        io.to(userId).emit('user:bet:placed', parsed);
      }
    } catch (err) {
      console.error('❌ Error parsing Redis pmessage:', err);
    }
  });

  redisSubscriber.subscribe('newMessage', (err, count) => {
    if (err) {
      console.error('❌ Redis subscription error:', err);
    } else {
      console.log(`📨 Subscribed to 'newMessage' (${count} channels)`);
    }
  });

  redisSubscriber.on('message', (channel, message) => {
    try {
      const parsed = JSON.parse(message);

      if (channel === 'newMessage') {
        io.emit('newMessage', parsed);
      }
    } catch (err) {
      console.error('❌ Error parsing Redis message:', err);
    }
  });
