import { redis } from "../app/lib/redis";
import { User } from "../app/modules/User/user.model";

export async function getUserCache(userId: string) {
    const userKey = `user:${userId}`;
    const [balanceStr, nonceStr] = await redis.hmget(userKey, 'balance', 'nonce');
  
    if (balanceStr === null || nonceStr === null) {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
  
      const balance = user.balance || 0;
      const nonce = user.nonce || 0;
  
      redis.hmset(userKey, { balance: balance.toString(), nonce: nonce.toString() });
      redis.expire(userKey, 5);
  
      return { balance, nonce };
    }
  
    return {
      balance: parseFloat(balanceStr),
      nonce: parseInt(nonceStr),
    };
  }
  