import { describe, it, expect } from 'vitest';
import { createApp } from './app.js';
import { Forbidden } from './kernel/authorization.js';
import { QuotaExceeded } from './kernel/quota-service.js';

describe('API Server (Fastify App)', () => {
  it('GET /healthz returns 200 and liveness payload', async () => {
    const app = await createApp();
    const res = await app.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('platform-api');
    expect(body.timestamp).toBeDefined();
  });

  it('GET /readyz returns 200 when ready', async () => {
    const app = await createApp({
      checkReadiness: async () => true,
    });
    const res = await app.inject({
      method: 'GET',
      url: '/readyz',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ready');
  });

  it('GET /readyz returns 503 when readiness check fails', async () => {
    const app = await createApp({
      checkReadiness: async () => false,
    });
    const res = await app.inject({
      method: 'GET',
      url: '/readyz',
    });

    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('unready');
  });

  it('returns RFC 9457 problem details on 404 not found', async () => {
    const app = await createApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/unknown-resource',
    });

    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const body = JSON.parse(res.body);
    expect(body.code).toBe('routing.not_found');
    expect(body.status).toBe(404);
    expect(body.instance).toBe('/api/v1/unknown-resource');
  });

  it('preserves x-correlation-id header across request and error response', async () => {
    const app = await createApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/missing',
      headers: {
        'x-correlation-id': 'custom-corr-123',
      },
    });

    expect(res.headers['x-correlation-id']).toBe('custom-corr-123');
    const body = JSON.parse(res.body);
    expect(body.correlationId).toBe('custom-corr-123');
  });

  it('formats kernel Forbidden error as RFC 9457 with status 403', async () => {
    const app = await createApp();
    app.get('/api/test-forbidden', async () => {
      throw new Forbidden();
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/test-forbidden',
    });

    expect(res.statusCode).toBe(403);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const body = JSON.parse(res.body);
    expect(body.code).toBe('authz.forbidden');
    expect(body.status).toBe(403);
  });

  it('formats QuotaExceeded error as RFC 9457 with status 429', async () => {
    const app = await createApp();
    app.get('/api/test-quota', async () => {
      throw new QuotaExceeded('commerce.products');
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/test-quota',
    });

    expect(res.statusCode).toBe(429);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const body = JSON.parse(res.body);
    expect(body.code).toBe('billing.quota_exceeded');
    expect(body.status).toBe(429);
  });
});
