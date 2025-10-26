
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from 'socket.io';
import { LimboBetServices } from '../../modules/limbo/bet/bet.service';

export const registerDiceEvents = (io: Server) => {
  io.on('connection', (socket) => {
    socket.on('limbo:placeBet', async (payload, callback) => {
      try {
        const authUser = (socket as any).user || null;
        const betData = await LimboBetServices.placeLimboBet(payload, authUser);
        callback({ success: true, data: { bet: betData } });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });
  });
};
