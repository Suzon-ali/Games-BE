import { redis } from '../app/lib/redis';
import { User } from '../app/modules/User/user.model';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getUserCache(
  userId: string,
  retryCount = 0,
): Promise<{
  balance: number;
  nonce: number;
  serverSeed: string;
  serverSeedHash: string;
}> {
  // Validate userId
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid userId provided to getUserCache');
  }

  // Prevent infinite recursion
  const MAX_RETRIES = 3;
  if (retryCount >= MAX_RETRIES) {
    throw new Error(
      `getUserCache: Max retries (${MAX_RETRIES}) exceeded for userId: ${userId}`,
    );
  }

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
        serverSeed: cached.serverSeed,
        serverSeedHash: cached.serverSeedHash,
      };
    }

    // Try acquiring a short-lived lock (50ms)
    const lock = await redis.set(lockKey, '1', 'PX', 50, 'NX');

    if (lock) {
      try {
        // Lock acquired: fetch from DB and cache the result
        const user = await User.findById(userId)
          .select('balance nonce serverSeed serverSeedHash')
          .lean();

        if (!user) {
          console.error(`User not found in database: ${userId}`);
          throw new Error(`User not found in database: ${userId}`);
        }

        const balance = user.balance ?? 0;
        const nonce = user.nonce ?? 0;
        const serverSeed = user.serverSeed ?? '';
        const serverSeedHash = user.serverSeedHash ?? '';

        // Cache all fields including serverSeed and serverSeedHash
        await redis
          .multi()
          .hset(
            userKey,
            'balance',
            balance.toString(),
            'nonce',
            nonce.toString(),
            'serverSeed',
            serverSeed,
            'serverSeedHash',
            serverSeedHash,
          )
          .expire(userKey, 900)
          .exec();

        return { balance, nonce, serverSeed, serverSeedHash };
      } catch (dbError: unknown) {
        const errorMessage =
          dbError instanceof Error ? dbError.message : 'Unknown database error';
        console.error(`Database error for userId ${userId}:`, errorMessage);
        throw new Error(`Database error: ${errorMessage}`);
      }
    } else {
      // Lock not acquired: wait and retry with exponential backoff
      const waitTime = Math.min(100 * Math.pow(2, retryCount), 1000);
      await sleep(waitTime);
      return getUserCache(userId, retryCount + 1);
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`getUserCache error for userId ${userId}:`, errorMessage);
    throw error;
  } finally {
    // Always release the lock after caching is done
    await redis.del(lockKey).catch(() => {});
  }
}
