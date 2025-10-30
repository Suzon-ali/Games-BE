/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from 'socket.io';
import { ChatServices } from '../../modules/Chat/chat.service';
import { redis } from '../../lib/redis';

export const registerChatEvents = (io: Server) => {

  io.on("connection", (socket) => {
    socket.on("send:Message", async (payload, callback) => {
      try {
        const authUser = (socket as any).user || null;
        const messageData = await ChatServices.createChatIntoDB(
          authUser,
          payload.message
        );
  
        // Publish to Redis — all servers will handle broadcast
        await redis.publish("newMessage", JSON.stringify(messageData));
  
        // Acknowledge sender only (don’t broadcast here)
        callback({ success: true, data: { message: messageData } });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });
  });
};
