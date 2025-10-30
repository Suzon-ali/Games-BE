import { Server } from 'socket.io';
import { redisSubscriber } from '../../lib/redis';

export const initRedisSubscribers = (io: Server) => {
  // latestBets
  redisSubscriber.subscribe('latestBets', (err, count) => {
    if (err) console.error('❌ Redis subscription error:', err);
    else console.log(`📨 Subscribed to 'latestBets' (${count} channels)`);
  });

  redisSubscriber.subscribe('newMessage', (err, count) => {
    if (err) console.error('❌ Redis subscription error:', err);
    else console.log(`💬 Subscribed to 'newMessage' (${count} channels)`);
  });

  redisSubscriber.on('message', (channel, message) => {
    try {
      const parsed = JSON.parse(message);
      if (channel === 'latestBets') io.emit('latestBets', parsed);
      if (channel === 'newMessage') io.emit('sent:Message', parsed);
    } catch (err) {
      console.error('❌ Error parsing Redis message:', err);
    }
  });

  // Wallet updates
  redisSubscriber.psubscribe('wallet:update:*', (err, count) => {
    if (err) console.error('Redis psubscribe error:', err);
    else console.log(`📨 Subscribed to 'walletUpdate' (${count} channels)`);
  });

  redisSubscriber.psubscribe('user:bet:placed:*', (err, count) => {
    if (err) console.error('Redis psubscribe error:', err);
    else
      console.log(`📨 Subscribed to 'user:bet:placed:*' (${count} channels)`);
  });

  redisSubscriber.on('pmessage', (pattern, channel, message) => {
    try {
      const parsed = JSON.parse(message);
      if (pattern === 'wallet:update:*' && parsed?.userId)
        io.to(parsed.userId).emit('wallet:update', parsed);
      if (pattern === 'user:bet:placed:*' && parsed?.userId)
        io.to(parsed.userId).emit('user:bet:placed', parsed);
    } catch (err) {
      console.error('❌ Error parsing Redis pmessage:', err);
    }
  });
};
