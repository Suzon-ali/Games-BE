import { redis } from "../app/lib/redis";
import { User } from "../app/modules/User/user.model";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getUserCache(userId: string): Promise<{ balance: number; nonce: number }> {
  const userKey = `user:${userId}`;
  const lockKey = `lock:cache:${userId}`;

  try {
    // Try reading from cache first
    const cached = await redis.hgetall(userKey);

    if (cached?.balance && cached?.nonce) {
      return {
        balance: parseFloat(cached.balance),
        nonce: parseInt(cached.nonce),
      };
    }

    // Try acquiring a short-lived lock (20ms)
    const lock = await redis.set(lockKey, '1', 'PX', 1, 'NX');

    if (lock) {
      // Lock acquired: fetch from DB and cache the result
      const user = await User.findById(userId).select('balance nonce').lean();
      if (!user) throw new Error('User not found in database');

      const balance = user.balance ?? 0;
      const nonce = user.nonce ?? 0;

      // Use pipeline for atomic update
      await redis
        .multi()
        .hset(userKey, 'balance', balance.toString(), 'nonce', nonce.toString())
        .expire(userKey, 900)
        .exec();

      return { balance, nonce };
    } else {
      // Lock not acquired: wait and retry
      await sleep(100);
      return getUserCache(userId);
    }
  } finally {
    // Always release the lock after caching is done
    await redis.del(lockKey).catch(() => {});
  }
}
