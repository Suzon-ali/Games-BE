import cookie from 'cookie';
import { Server as HTTPServer } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import config from '../config';
import { redisSubscriber } from '../lib/redis';
import { ChatServices } from '../modules/Chat/chat.service';
import { BetServices } from '../modules/dice/bet/bet.service';

// --- Interface Definition (Assuming it's here or imported) ---

// Define the shape of the user object after JWT decoding
interface DecodedUser extends JwtPayload {
  userId?: string;
  email?: string;
}

// Extend the base Socket type to include the authenticated user property
export interface AuthenticatedSocket extends Socket {
  user: DecodedUser | null;
}

// --- End Interface Definition ---

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
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  console.log('🚀 Socket.IO server initialized');

  // Connection error handling
  io.engine.on('connection_error', (err) => {
    console.error('❌ Socket.IO connection error:', err);
  });

  // 🔐 Authentication middleware
  io.use((socket: Socket, next) => {
    const authSocket = socket as AuthenticatedSocket; // Type assertion once here
    
    try {
      let token = authSocket.handshake.auth?.token;

      if (!token) {
        const rawCookie = authSocket?.request?.headers?.cookie || '';
        const cookiesParsed = cookie.parse(rawCookie);
        token = cookiesParsed.accessToken;
      }

      if (!token) {
        // Allows connection as a guest
        console.log('👤 Guest socket connected (no token)');
        authSocket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, config.jwt_access_secret as string) as DecodedUser;
      authSocket.user = decoded;
      console.log(`🔐 Authenticated user: ${decoded.userId || decoded.email}`);
      return next();
    } catch (err: any) {
      // Invalid token, connects as a guest instead of failing
      console.log('Invalid token, connecting as guest:', err.message);
      authSocket.user = null;
      return next();
    }
  });

  // 🎧 Unified socket connection
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🟢 New connection: ${socket.id}`);

    // 👤 Join user room
    socket.on('join', (userId: string) => {
      try {
        const authUser = socket.user;
        const targetUserId = userId || authUser?.userId;

        if (targetUserId) {
          socket.join(targetUserId);
          socket.join('general');
          console.log(`✅ User ${targetUserId} joined rooms (socket: ${socket.id})`);
          socket.emit('joined', {
            success: true,
            userId: targetUserId,
            room: targetUserId,
            socketId: socket.id,
          });
        } else {
          console.log("⚠️ 'join' event called without userId or auth");
          socket.emit('joined', { success: false, error: 'User ID is required' });
        }
      } catch (error: any) {
        console.error('❌ Error joining room:', error);
        socket.emit('joined', { success: false, error: 'Failed to join room' }); // Safer error message
      }
    });

    // 🔄 Auto rejoin
    socket.on('rejoin', () => {
      const authUser = socket.user;
      if (authUser?.userId) {
        socket.join(authUser.userId);
        socket.join('general');
        console.log(`🔄 User ${authUser.userId} rejoined rooms`);
        socket.emit('rejoined', { success: true, userId: authUser.userId });
      }
    });

    // 🎲 Dice bet handler
    socket.on('dice:placeBet', async (payload, callback) => {
      const authUser = socket.user;

      if (!authUser?.userId) {
        return callback({ success: false, error: 'Authentication required to place a bet.' });
      }

      try {
        const betData = await BetServices.placeBet(payload, authUser);
        callback({ success: true, data: { bet: betData } });
      } catch (err: any) {
        console.error('❌ Error placing bet:', err);
        // Safely return specific error message if it's a known validation error (e.g., "Insufficient funds")
        const clientErrorMessage = err.message.includes('Insufficient') || err.message.includes('Validation') 
            ? err.message 
            : 'Failed to place bet due to a server error.';
            
        callback({ success: false, error: clientErrorMessage }); 
      }
    });

    // 💬 Chat message handler
    socket.on('sent:Message', async (payload, callback) => {
      const authUser = socket.user;

      if (!authUser?.userId) {
        return callback({ success: false, error: 'Authentication required to send a message.' });
      }

      try {
        const messageData = await ChatServices.createChatIntoDB(authUser, payload.message);
        callback({ success: true, data: { message: messageData } });
      } catch (err: any) {
        console.error('❌ Error sending message:', err);
        callback({ success: false, error: 'Failed to send message.' }); // Safer error message
      }
    });

    // 🔌 Disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔴 Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // ⚠️ Error handler
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  // 🔔 Redis Subscriptions
  redisSubscriber.subscribe('latestBets', (err, count) => {
    if (err) console.error('❌ Redis subscription error:', err);
    else console.log(`📨 Subscribed to 'latestBets' (${count} channels)`);
  });

  redisSubscriber.subscribe('newMessage', (err, count) => {
    if (err) console.error('❌ Redis subscription error:', err);
    else console.log(`📨 Subscribed to 'newMessage' (${count} channels)`);
  });

  redisSubscriber.psubscribe('wallet:update:*', (err, count) => {
    if (err) console.error('Redis psubscribe error:', err);
    else console.log(`📨 Subscribed to 'wallet:update:*' (${count} channels)`);
  });

  redisSubscriber.psubscribe('user:bet:placed:*', (err, count) => {
    if (err) console.error('Redis psubscribe error:', err);
    else console.log(`📨 Subscribed to 'user:bet:placed:*' (${count} channels)`);
  });

  // 🔔 Handle Redis Messages
  redisSubscriber.on('message', (channel, message) => {
    try {
      const parsed = JSON.parse(message);
      if (channel === 'latestBets') io.emit('latestBets', parsed);
      if (channel === 'newMessage') io.emit('newMessage', parsed);
    } catch (err) {
      console.error('❌ Error parsing Redis message:', err);
    }
  });

  redisSubscriber.on('pmessage', (pattern, channel, message) => {
    try {
      const parsed = JSON.parse(message);
      const userId = parsed?.userId;

      if (pattern === 'wallet:update:*' && userId) {
        io.to(userId).emit('wallet:update', parsed);
      }
      if (pattern === 'user:bet:placed:*' && userId) {
        io.to(userId).emit('user:bet:placed', parsed);
      }
    } catch (err) {
      console.error('❌ Error parsing Redis pmessage:', err);
    }
  });

  // 🔁 Redis Connection Events
  redisSubscriber.on('error', (err) => {
    console.error('❌ Redis subscriber error:', err);
  });

  redisSubscriber.on('connect', () => {
    console.log('✅ Redis subscriber connected');
  });

  redisSubscriber.on('reconnecting', () => {
    console.log('🔄 Redis subscriber reconnecting...');
  });
};