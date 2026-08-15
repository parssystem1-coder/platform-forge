import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { randomUUID } from 'node:crypto';
import { requestContextStorage, type RequestContext } from './common/request-context.js';
import { problemDetailsErrorHandler } from './common/problem-details.js';
import { healthRoutes } from './routes/health.js';

export interface CreateAppOptions {
  checkReadiness?: (() => Promise<boolean>) | undefined;
}

export async function createApp(opts: CreateAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(cookie);

  // Request Context & Tracing Middleware Hook
  app.addHook('onRequest', (request, reply, done) => {
    const requestId = (request.headers['x-request-id'] as string) || randomUUID();
    const correlationId = (request.headers['x-correlation-id'] as string) || randomUUID();
    const tenantId = (request.headers['x-tenant-id'] as string) || undefined;

    reply.header('x-request-id', requestId);
    reply.header('x-correlation-id', correlationId);

    const ctx: RequestContext = {
      requestId,
      correlationId,
      ...(tenantId ? { tenantId } : {}),
    };

    requestContextStorage.run(ctx, () => {
      done();
    });
  });

  // Problem Details Error Handler (RFC 9457)
  app.setErrorHandler(problemDetailsErrorHandler);

  // 404 Handler using Problem Details
  app.setNotFoundHandler((request, reply) => {
    reply
      .status(404)
      .header('content-type', 'application/problem+json; charset=utf-8')
      .send({
        type: 'https://errors.platform.example/routing.not_found',
        title: 'Resource Not Found',
        status: 404,
        code: 'routing.not_found',
        detail: `Route ${request.method} ${request.url} not found`,
        instance: request.url,
        correlationId: (request.headers['x-correlation-id'] as string) || 'unknown',
      });
  });

  // Health and Readiness probes
  await app.register(healthRoutes, {
    checkReadiness: opts.checkReadiness,
  });

  return app;
}
