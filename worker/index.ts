import { Worker } from 'bullmq';
import { initializeStarkBank } from './starkbank-setup';
import { processWebhookJob } from './webhook-processor';

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

initializeStarkBank();

const worker = new Worker('starkbank-webhooks', processWebhookJob, { connection: redisOptions });

worker.on('completed', () => {});
worker.on('failed', () => {});
