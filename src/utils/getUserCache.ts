import { redis } from '../app/lib/redis';
import { User } from '../app/modules/User/user.model';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getUserCache(
  userId: string,
): Promise<{
  balance: number;
  nonce: number;
  serverSeed: string;
  serverSeedHash: string;
}> {
  const userKey = `user:${userId}`;
  const lockKey = `lock:cache:${userId}`;

  try {
    // Try reading from cache first
    const cached = await redis.hgetall(userKey);

    if (
      cached?.balance &&
      cached?.nonce &&
      cached?.serverSeed &&
      cached?.serverSeedHash
    ) {
      return {
        balance: parseFloat(cached.balance),
        nonce: parseInt(cached.nonce),
        serverSeed: cached?.serverSeed,
        serverSeedHash: cached?.serverSeedHash,
      };
    }

    // Try acquiring a short-lived lock (20ms)
    const lock = await redis.set(lockKey, '1', 'PX', 1, 'NX');

    if (lock) {
      // Lock acquired: fetch from DB and cache the result
      const user = await User.findById(userId)
        .select('balance nonce serverSeed serverSeedHash')
        .lean();
      if (!user) throw new Error('User not found in database');

      const balance = user.balance ?? 0;
      const nonce = user.nonce ?? 0;
      const serverSeed = user.serverSeed ?? '';
      const serverSeedHash = user.serverSeedHash ?? '';

      // Use pipeline for atomic update
      await redis
        .multi()
        .hset(userKey, 'balance', balance.toString(), 'nonce', nonce.toString())
        .expire(userKey, 900)
        .exec();

      return { balance, nonce, serverSeed, serverSeedHash };
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
