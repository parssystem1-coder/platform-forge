import { describe, it, expect } from 'vitest';
import { createApp } from '../../app.js';
import type { Pool, Tx } from '@platform/contracts';

describe('Auth API Endpoints', () => {
  it('POST /api/v1/auth/register registers user, tenant and owner membership', async () => {
    const executedQueries: string[] = [];

    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        const mockTx: Tx = {
          async query<R>(sql: string, params?: unknown[]) {
            executedQueries.push(sql);
            if (sql.includes('SELECT id FROM users')) return [] as R[];
            if (sql.includes('SELECT id FROM tenants')) return [] as R[];
            return [] as R[];
          },
        };
        return fn(mockTx);
      },
    };

    const app = await createApp({ pool: mockPool });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'founder@example.com',
        password: 'SuperSecretPassword123!',
        displayName: 'John Founder',
        tenantSlug: 'my-shop',
        tenantName: 'My Awesome Shop',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.userId).toBeDefined();
    expect(body.tenantId).toBeDefined();
    expect(body.status).toBe('pending_verification');

    expect(executedQueries.some((q) => q.includes('INSERT INTO users'))).toBe(true);
    expect(executedQueries.some((q) => q.includes('INSERT INTO tenants'))).toBe(true);
    expect(executedQueries.some((q) => q.includes('INSERT INTO memberships'))).toBe(true);
    expect(executedQueries.some((q) => q.includes('INSERT INTO outbox_events'))).toBe(true);
  });

  it('POST /api/v1/auth/register rejects duplicate email with 409', async () => {
    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        const mockTx: Tx = {
          async query<R>(sql: string) {
            if (sql.includes('SELECT id FROM users')) {
              return [{ id: 'existing-user-id' }] as R[];
            }
            return [] as R[];
          },
        };
        return fn(mockTx);
      },
    };

    const app = await createApp({ pool: mockPool });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'duplicate@example.com',
        password: 'Password123!',
        displayName: 'John Duplicate',
        tenantSlug: 'shop-dup',
        tenantName: 'Shop Dup',
      },
    });

    expect(res.statusCode).toBe(409);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const body = JSON.parse(res.body);
    expect(body.code).toBe('identity.email_already_used');
  });

  it('POST /api/v1/auth/verify-email activates user', async () => {
    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        const mockTx: Tx = {
          async query<R>(sql: string) {
            if (sql.includes('SELECT id, user_id, expires_at')) {
              return [
                {
                  id: 'tok-1',
                  user_id: 'user-1',
                  expires_at: new Date(Date.now() + 100000),
                  consumed_at: null,
                },
              ] as R[];
            }
            return [] as R[];
          },
        };
        return fn(mockTx);
      },
    };

    const app = await createApp({ pool: mockPool });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-email',
      payload: {
        token: 'sample-token-abc',
      },
    });

    expect(res.statusCode).toBe(204);
  });
});
