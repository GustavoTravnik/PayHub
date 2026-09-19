import { Queue } from 'bullmq';

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const webhookQueue = new Queue('starkbank-webhooks', {
  connection: redisOptions,
});
