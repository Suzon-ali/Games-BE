
import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { applySocketMiddleware } from './middleware';
import { registerConnectionEvents } from './events/connection';
import { registerDiceEvents } from './events/dice';
import { registerChatEvents } from './events/chat';
import { initRedisSubscribers } from './events/redis';


export let io: Server;

export const initSocketServer = (server: HTTPServer): void => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://games-client-fqmo.vercel.app',
        'https://games-client-production.up.railway.app',
        'http://192.168.0.183:3000',
        'https://rolltoday.online',
        'https://dev.rolltoday.online',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  console.log('🚀 Socket.IO server initialized');

  // Apply middleware
  applySocketMiddleware(io);

  // Register socket events
  registerConnectionEvents(io);
  registerDiceEvents(io);
  registerChatEvents(io);

  // Setup Redis pub/sub
  initRedisSubscribers(io);
};
