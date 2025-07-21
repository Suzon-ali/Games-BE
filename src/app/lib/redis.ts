import Redis from 'ioredis';
import config from '../config';

const redisUrl =
  config.node_env === 'production'
    ? (process.env.REDIS_URL + '?family=0')!
    : 'localhost';

if (!redisUrl) {
  console.error('❌REDIS_URL is undefined.');
  throw new Error('REDIS_URL is not set in environment variables.');
}

console.log('✅ Connecting to Redis at:', redisUrl);

export const redis = new Redis(redisUrl);

export const redisSubscriber = new Redis(redisUrl);
