import Redis from 'ioredis';
import config from '../config';

const redisUrl = config.redis_url;

if (!redisUrl) {
  console.error('❌ REDIS_URL is undefined.');
  throw new Error('REDIS_URL is not set in environment variables.');
}

console.log('✅ Connecting to Redis at:', redisUrl);

const redisOptions = {
  family: 0, // 🔥 This is the key fix — enables IPv6 resolution
};

// Connect with full Redis URL and options
export const redis = new Redis(redisUrl, redisOptions);
export const redisSubscriber = new Redis(redisUrl, redisOptions);

