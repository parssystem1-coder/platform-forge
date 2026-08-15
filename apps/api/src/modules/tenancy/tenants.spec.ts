import { describe, it, expect } from 'vitest';
import { createApp } from '../../app.js';
import { CryptoTokenService } from '../identity/index.js';
import type { Pool, Tx } from '@platform/contracts';

describe('Tenancy API Endpoints', () => {
  const tokenSecret = 'test-secret-at-least-32-chars-long-abc';
  const tokenService = new CryptoTokenService(tokenSecret);

  it('GET /api/v1/tenants lists user active memberships with Bearer token', async () => {
    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        const mockTx: Tx = {
          async query<R>(sql: string) {
            if (sql.includes('FROM memberships m')) {
              return [
                {
                  tenant_id: 'tenant-1',
                  tenant_slug: 'shop-one',
                  tenant_name: 'Shop One',
                  role: 'owner',
                  status: 'active',
                },
              ] as R[];
            }
            return [] as R[];
          },
        };
        return fn(mockTx);
      },
    };

    const app = await createApp({ pool: mockPool, jwtSecret: tokenSecret });

    const validToken = tokenService.generateAccessToken({
      userId: 'user-123',
      email: 'user@example.com',
      sessionId: 'session-123',
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tenants',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(1);
    expect(body[0].tenantSlug).toBe('shop-one');
    expect(body[0].role).toBe('owner');
  });

  it('GET /api/v1/tenants rejects request without Bearer token with 401', async () => {
    const app = await createApp();

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tenants',
    });

    expect(res.statusCode).toBe(401);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const body = JSON.parse(res.body);
    expect(body.code).toBe('auth.unauthorized');
  });

  it('POST /api/v1/tenants/switch switches tenant context for authorized member', async () => {
    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        const mockTx: Tx = {
          async query<R>(sql: string) {
            if (sql.includes('SELECT id FROM memberships')) {
              return [{ id: 'membership-1' }] as R[];
            }
            return [] as R[];
          },
        };
        return fn(mockTx);
      },
    };

    const app = await createApp({ pool: mockPool, jwtSecret: tokenSecret });

    const validToken = tokenService.generateAccessToken({
      userId: 'user-123',
      email: 'user@example.com',
      sessionId: 'session-123',
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tenants/switch',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
      payload: {
        tenantId: 'tenant-1',
      },
    });

    expect(res.statusCode).toBe(204);
  });
});
