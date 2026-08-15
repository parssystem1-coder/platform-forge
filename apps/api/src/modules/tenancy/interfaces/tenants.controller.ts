import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { ListUserTenantsUseCase } from '../application/list-user-tenants.use-case.js';
import type { SwitchTenantUseCase } from '../application/switch-tenant.use-case.js';
import { UnauthorizedError, type TokenServicePort } from '../../identity/index.js';
import type { SwitchTenantRequest } from '@platform/contracts';

export interface TenantsControllerOptions {
  listTenantsUseCase: ListUserTenantsUseCase;
  switchTenantUseCase: SwitchTenantUseCase;
  tokenService: TokenServicePort;
}

function extractBearerUser(req: FastifyRequest, tokenService: TokenServicePort) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return tokenService.verifyAccessToken(token);
}

export const tenantsRoutes: FastifyPluginAsync<TenantsControllerOptions> = async (fastify, opts) => {
  // 1. GET /api/v1/me
  fastify.get('/api/v1/me', async (request, reply) => {
    const actor = extractBearerUser(request, opts.tokenService);
    if (!actor) {
      throw new UnauthorizedError();
    }

    const memberships = await opts.listTenantsUseCase.execute(actor.userId);

    return reply.status(200).send({
      user: {
        id: actor.userId,
        email: actor.email,
      },
      memberships,
    });
  });

  // 2. GET /api/v1/tenants
  fastify.get('/api/v1/tenants', async (request, reply) => {
    const actor = extractBearerUser(request, opts.tokenService);
    if (!actor) {
      throw new UnauthorizedError();
    }

    const memberships = await opts.listTenantsUseCase.execute(actor.userId);
    return reply.status(200).send(memberships);
  });

  // 3. POST /api/v1/tenants/switch
  fastify.post<{ Body: SwitchTenantRequest }>('/api/v1/tenants/switch', async (request, reply) => {
    const actor = extractBearerUser(request, opts.tokenService);
    if (!actor) {
      throw new UnauthorizedError();
    }

    const { tenantId } = request.body || {};
    if (!tenantId) {
      return reply.status(400).send({
        type: 'https://errors.platform.example/validation.invalid_input',
        title: 'Validation Failed',
        status: 400,
        code: 'validation.invalid_input',
        detail: 'tenantId is required',
      });
    }

    await opts.switchTenantUseCase.execute(actor.userId, tenantId);

    return reply.status(204).send();
  });
};
