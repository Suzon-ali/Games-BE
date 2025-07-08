/* eslint-disable no-console */
// Inside your socket setup, e.g. in bet.socket.ts or wherever you register handlers

import { Server, Socket } from 'socket.io';
import { BetServices } from './bet.service';

export const registerBetSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('✅ WebSocket connected:', socket.id);

    socket.on('place_bet', async (data, callback) => {
      try {
        const bet = await BetServices.placeBet(data);

        // Send the result ONLY to the user who placed the bet via callback
        callback({ success: true, data: bet });

        // Optionally broadcast to all users about the new bet
        io.emit('new_bet', bet);
      } catch (error) {
        console.error('❌ place_bet error:', error);
        callback({ success: false, message: error  || 'Bet error' });
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected:', socket.id);
    });
  });
};
