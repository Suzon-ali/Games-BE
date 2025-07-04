/* eslint-disable no-console */
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { registerBetSocketHandlers } from '../modules/dice/bet/bet.socket';
import { IBet } from '../modules/dice/bet/bet.interface';

export let io: Server;

export const initSocketServer = (server: HTTPServer): void => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
  console.log('🚀 Socket.IO server initialized');

  registerBetSocketHandlers(io);

  io.on('connection', (socket: Socket) => {
    console.log(`📡 Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

export const broadcastNewBet = (bet: IBet): void => {
  if (!io) {
    return console.error('❌ Socket.IO not initialized. Cannot broadcast message.');
  }
  io.emit('new_bet', bet);
};
