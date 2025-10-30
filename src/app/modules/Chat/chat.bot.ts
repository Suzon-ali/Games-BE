import { ChatServices } from './chat.service';
import { botUsers, ChatMessages } from './chat.constant';
import { JwtPayload } from 'jsonwebtoken';

const BOT_INTERVAL_MIN = 1000; // 1 seconds
const BOT_INTERVAL_MAX = 5000; // 5 seconds

export const startBotChat = async () => {
  const sendBotMessage = async () => {
    try {
      // Pick random bot
      const bot = botUsers[Math.floor(Math.random() * botUsers.length)];

      // Pick random message
      const message =
        ChatMessages[Math.floor(Math.random() * ChatMessages.length)];

      // Create payload like real user
      const authUser = { userId: bot.id } as JwtPayload;

      await ChatServices.createChatIntoDB(authUser, message);
    } catch (err) {
      console.error('Failed to send bot message:', err);
    }

    // Schedule next message
    const nextDelay =
      Math.floor(Math.random() * (BOT_INTERVAL_MAX - BOT_INTERVAL_MIN + 1)) +
      BOT_INTERVAL_MIN;

    setTimeout(sendBotMessage, nextDelay);
  };

  sendBotMessage();
};
