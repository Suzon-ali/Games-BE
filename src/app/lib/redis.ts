import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL + '?family=0');

export const redisSubscriber = new Redis(process.env.REDIS_URL + '?family=0');
