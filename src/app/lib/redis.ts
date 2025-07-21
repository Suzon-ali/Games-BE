import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
console.log(process.env.REDIS_URL)

export const redis = new Redis(redisUrl);

export const redisSubscriber = new Redis();
