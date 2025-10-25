/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from 'socket.io';
import { ChatServices } from '../../modules/Chat/chat.service';


export const registerChatEvents = (io: Server) => {
  io.on('connection', (socket) => {
    socket.on('sent:Message', async (payload, callback) => {
      try {
        const authUser = (socket as any).user || null;
        const messageData = await ChatServices.createChatIntoDB(
          authUser,
          payload.message,
        );
        console.log(payload)
        callback({ success: true, data: { message: messageData } });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });
  });
};
