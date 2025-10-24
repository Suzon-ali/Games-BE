import Redis from 'ioredis';

// Use URL if available, otherwise use individual config
const redisUrl = process.env.REDIS_URL;

export const redis = redisUrl
  ? new Redis(redisUrl + '?family=0')
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      family: 0, // Use IPv4
    });

export const redisSubscriber = redisUrl
  ? new Redis(redisUrl + '?family=0')
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      family: 0, // Use IPv4
    });

// Handle Redis connection events
redis.on('connect', () => {
  console.log('✅ Redis client connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis client error:', err);
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis client reconnecting...');
});

redisSubscriber.on('connect', () => {
  console.log('✅ Redis subscriber connected');
});

redisSubscriber.on('error', (err) => {
  console.error('❌ Redis subscriber error:', err);
});

redisSubscriber.on('reconnecting', () => {
  console.log('🔄 Redis subscriber reconnecting...');
});
