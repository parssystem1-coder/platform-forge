import type { FastifyPluginAsync } from 'fastify';

export interface HealthCheckOptions {
  checkReadiness?: (() => Promise<boolean>) | undefined;
}

export const healthRoutes: FastifyPluginAsync<HealthCheckOptions> = async (fastify, opts) => {
  // Liveness probe - returns 200 as long as the server is listening
  fastify.get('/healthz', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'platform-api',
    });
  });

  // Readiness probe - returns 200 when ready to accept traffic, 503 if dependencies down
  fastify.get('/readyz', async (_request, reply) => {
    if (opts.checkReadiness) {
      try {
        const isReady = await opts.checkReadiness();
        if (!isReady) {
          return reply.status(503).send({ status: 'unready', reason: 'dependency_check_failed' });
        }
      } catch (err) {
        return reply.status(503).send({
          status: 'unready',
          reason: err instanceof Error ? err.message : 'dependency_error',
        });
      }
    }

    return reply.status(200).send({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  });
};
