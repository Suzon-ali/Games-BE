import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  family: 0, // Use IPv4
};

export const redis = new Redis({
  ...redisConfig,
  url: process.env.REDIS_URL + '?family=0',
});

export const redisSubscriber = new Redis({
  ...redisConfig,
  url: process.env.REDIS_URL + '?family=0',
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
