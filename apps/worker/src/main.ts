import { WorkerRunner } from './runner.js';
import { OutboxPublisher } from './outbox-publisher.js';
import { createDatabasePool } from '@platform/database';

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL_WORKER ||
    process.env.DATABASE_URL ||
    'postgres://platform_worker:ci-worker-password@localhost:5432/platform';

  const pool = createDatabasePool({ connectionString: databaseUrl });

  const bus = {
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
  const publisher = new OutboxPublisher(pool, bus, workerId, metrics);
  const runner = new WorkerRunner(publisher, { idleIntervalMs: 2000 });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Stopping worker...`);
    await runner.stop();
    await pool.close();
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
