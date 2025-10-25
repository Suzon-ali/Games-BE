/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from 'socket.io';
import { BetServices } from '../../modules/dice/bet/bet.service';

export const registerDiceEvents = (io: Server) => {
  io.on('connection', (socket) => {
    socket.on('dice:placeBet', async (payload, callback) => {
      try {
        const authUser = (socket as any).user || null;
        const betData = await BetServices.placeBet(payload, authUser);
        callback({ success: true, data: { bet: betData } });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });
  });
};
