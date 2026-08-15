import pg from 'pg';
const { Pool: PgPool } = pg;
import type { Pool, Tx } from '@platform/contracts';

export interface DatabasePoolConfig {
  connectionString: string;
  maxConnections?: number | undefined;
  idleTimeoutMillis?: number | undefined;
  connectionTimeoutMillis?: number | undefined;
}

export class PostgresPoolWrapper implements Pool {
  private readonly pgPool: pg.Pool;

  constructor(config: DatabasePoolConfig) {
    this.pgPool = new PgPool({
      connectionString: config.connectionString,
      max: config.maxConnections ?? 10,
      idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis ?? 5000,
    });
  }

  async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');
      const tx: Tx = {
        async query<R = unknown>(sql: string, params?: unknown[]): Promise<R[]> {
          const res = await client.query(sql, params as unknown[]);
          return res.rows as R[];
        },
      };
      const result = await fn(tx);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async query<R = unknown>(sql: string, params?: unknown[]): Promise<R[]> {
    const res = await this.pgPool.query(sql, params as unknown[]);
    return res.rows as R[];
  }

  async close(): Promise<void> {
    await this.pgPool.end();
  }

  get rawPool(): pg.Pool {
    return this.pgPool;
  }
}

export function createDatabasePool(config: DatabasePoolConfig): PostgresPoolWrapper {
  return new PostgresPoolWrapper(config);
}
