import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redis = new Redis(redisUrl + '?family=0');
export const redisSubscriber = new Redis(redisUrl + '?family=0');

redis.on('error', (err) => console.error('Redis Error:', err));
