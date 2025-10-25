import { Server, Socket } from 'socket.io';

export const registerConnectionEvents = (io: Server) => {
  io.on('connection', (socket: Socket) => {
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
};
