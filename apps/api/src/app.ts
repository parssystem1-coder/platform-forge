import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { randomUUID } from 'node:crypto';
import type { Pool } from '@platform/contracts';
import { requestContextStorage, type RequestContext } from './common/request-context.js';
import { problemDetailsErrorHandler } from './common/problem-details.js';
import { healthRoutes } from './routes/health.js';
import { UnitOfWork } from './kernel/unit-of-work.js';
import { CryptoPasswordHasher } from './modules/identity/infrastructure/password-hasher.js';
import { CryptoTokenService } from './modules/identity/infrastructure/token-service.js';
import { RegisterUserUseCase } from './modules/identity/application/register-user.use-case.js';
import { LoginUserUseCase } from './modules/identity/application/login-user.use-case.js';
import { VerifyEmailUseCase } from './modules/identity/application/verify-email.use-case.js';
import { RefreshTokenUseCase } from './modules/identity/application/refresh-token.use-case.js';
import { authRoutes } from './modules/identity/interfaces/auth.controller.js';
import { ListUserTenantsUseCase } from './modules/tenancy/application/list-user-tenants.use-case.js';
import { SwitchTenantUseCase } from './modules/tenancy/application/switch-tenant.use-case.js';
import { tenantsRoutes } from './modules/tenancy/interfaces/tenants.controller.js';

export interface CreateAppOptions {
  pool?: Pool | undefined;
  jwtSecret?: string | undefined;
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

  // Wire Identity and Tenancy Modules
  const dummyPool: Pool = opts.pool ?? {
    async transaction<T>(fn: any): Promise<T> {
      return fn({ async query() { return []; } });
    },
  };

  const uow = new UnitOfWork(dummyPool);
  const hasher = new CryptoPasswordHasher();
  const tokenService = new CryptoTokenService(opts.jwtSecret || 'dev-secret-key-at-least-32-chars-long');

  const registerUseCase = new RegisterUserUseCase(uow, hasher, tokenService);
  const loginUseCase = new LoginUserUseCase(uow, hasher, tokenService);
  const verifyEmailUseCase = new VerifyEmailUseCase(uow, tokenService);
  const refreshTokenUseCase = new RefreshTokenUseCase(uow, tokenService);

  const listTenantsUseCase = new ListUserTenantsUseCase(uow);
  const switchTenantUseCase = new SwitchTenantUseCase(uow);

  await app.register(authRoutes, {
    registerUseCase,
    loginUseCase,
    verifyEmailUseCase,
    refreshTokenUseCase,
  });

  await app.register(tenantsRoutes, {
    listTenantsUseCase,
    switchTenantUseCase,
    tokenService,
  });

  return app;
}
