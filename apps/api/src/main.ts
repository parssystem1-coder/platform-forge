import { createApp } from './app.js';
import { env } from './config/env.js';
import { createDatabasePool } from '@platform/database';

async function main() {
  const dbPool = createDatabasePool({
    connectionString: env.DATABASE_URL,
  });

  const app = await createApp({
    pool: dbPool,
    jwtSecret: env.JWT_PRIVATE_KEY,
    checkReadiness: async () => {
      try {
        await dbPool.query('SELECT 1;');
        return true;
      } catch {
        return false;
      }
    },
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down API gracefully...`);
    try {
      await app.close();
      await dbPool.close();
      console.log('API closed successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    const host = '0.0.0.0';
    const port = env.PORT;
    await app.listen({ port, host });
    console.log(`🚀 Platform API listening on http://${host}:${port}`);
  } catch (err) {
    console.error('Failed to start API:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  main();
}
