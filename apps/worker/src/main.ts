import { WorkerRunner } from './runner.js';
import { OutboxPublisher } from './outbox-publisher.js';
import type { Pool } from '@platform/contracts';

// In production, Pool connects via pg / @platform/database
// For local demo/worker runner:
async function main() {
  const dummyPool: Pool = {
    async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
      return fn({
        async query() {
          return [];
        },
      });
    },
  };

  const dummyBus = {
    async publish(event: any) {
      console.log(`[EventBus] Published: ${event.event_type} (${event.id})`);
    },
  };

  const metrics = {
    published: (type: string) => console.log(`[Metrics] Published: ${type}`),
    retried: (type: string, a: number) => console.log(`[Metrics] Retried: ${type} attempt=${a}`),
    deadLettered: (type: string) => console.log(`[Metrics] DeadLettered: ${type}`),
  };

  const workerId = `worker-${process.pid}`;
  const publisher = new OutboxPublisher(dummyPool, dummyBus, workerId, metrics);
  const runner = new WorkerRunner(publisher, { idleIntervalMs: 2000 });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Stopping worker...`);
    await runner.stop();
    console.log('Worker stopped gracefully.');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  await runner.start();
  console.log(`⚙️ Worker daemon started with ID: ${workerId}`);
}

if (process.env.NODE_ENV !== 'test') {
  main();
}
