import Redis from 'ioredis';
import config from '../config';

export const redis = new Redis(
  config.node_env === 'production' ? config.redis_url! : 'localhost',
);

export const redisSubscriber = new Redis();
