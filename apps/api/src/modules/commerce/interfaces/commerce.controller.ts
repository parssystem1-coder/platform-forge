import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type {
  CreateProductUseCase,
  ListProductsUseCase,
  GetProductUseCase,
} from '../application/products.use-cases.js';
import type {
  CreateCartUseCase,
  AddItemToCartUseCase,
  CreateOrderFromCartUseCase,
  GetOrderUseCase,
} from '../application/orders.use-cases.js';
import { UnauthorizedError, type TokenServicePort } from '../../identity/index.js';

export interface CommerceControllerOptions {
  createProductUseCase: CreateProductUseCase;
  listProductsUseCase: ListProductsUseCase;
  getProductUseCase: GetProductUseCase;
  createCartUseCase: CreateCartUseCase;
  addItemToCartUseCase: AddItemToCartUseCase;
  createOrderFromCartUseCase: CreateOrderFromCartUseCase;
  getOrderUseCase: GetOrderUseCase;
  tokenService: TokenServicePort;
}

function extractTenantContext(req: FastifyRequest, tokenService: TokenServicePort): { tenantId: string; userId?: string } {
  // 1. From header
  const headerTenantId = req.headers['x-tenant-id'] as string;
  if (headerTenantId) {
    return { tenantId: headerTenantId };
  }

  // 2. From Bearer token
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const payload = tokenService.verifyAccessToken(token);
    if (payload?.activeTenantId) {
      return { tenantId: payload.activeTenantId, userId: payload.userId };
    }
  }

  throw new UnauthorizedError('Tenant context required (via X-Tenant-Id header or Bearer Token)');
}

export const commerceRoutes: FastifyPluginAsync<CommerceControllerOptions> = async (fastify, opts) => {
  // 1. POST /api/v1/products
  fastify.post('/api/v1/products', async (request, reply) => {
    const { tenantId } = extractTenantContext(request, opts.tokenService);
    const body = request.body as any;

    if (!body?.slug || !body?.title || typeof body?.priceMinor !== 'number' || !body?.sku || !body?.currency) {
      return reply.status(422).send({
        type: 'https://errors.platform.example/validation.invalid_input',
        title: 'Validation Failed',
        status: 422,
        code: 'validation.invalid_input',
        detail: 'slug, title, priceMinor, currency, and sku are required',
      });
    }

    const result = await opts.createProductUseCase.execute({
      tenantId,
      slug: body.slug,
      title: body.title,
      description: body.description,
      priceMinor: body.priceMinor,
      currency: body.currency,
      sku: body.sku,
      initialStock: body.initialStock ?? 100,
    });

    return reply.status(201).send(result);
  });

  // 2. GET /api/v1/products
  fastify.get('/api/v1/products', async (request, reply) => {
    const { tenantId } = extractTenantContext(request, opts.tokenService);
    const products = await opts.listProductsUseCase.execute(tenantId);
    return reply.status(200).send(products);
  });

  // 3. GET /api/v1/products/:id
  fastify.get<{ Params: { id: string } }>('/api/v1/products/:id', async (request, reply) => {
    const { tenantId } = extractTenantContext(request, opts.tokenService);
    const product = await opts.getProductUseCase.execute(tenantId, request.params.id);
    return reply.status(200).send(product);
  });

  // 4. POST /api/v1/carts
  fastify.post('/api/v1/carts', async (request, reply) => {
    const { tenantId, userId } = extractTenantContext(request, opts.tokenService);
    const body = (request.body as any) || {};

    const cart = await opts.createCartUseCase.execute({
      tenantId,
      customerId: body.customerId ?? userId,
      guestSessionId: body.guestSessionId,
      currency: body.currency || 'USD',
    });

    return reply.status(201).send(cart);
  });

  // 5. POST /api/v1/carts/:id/lines
  fastify.post<{ Params: { id: string }; Body: { variantId: string; quantity: number } }>(
    '/api/v1/carts/:id/lines',
    async (request, reply) => {
      const { tenantId } = extractTenantContext(request, opts.tokenService);
      const { variantId, quantity } = request.body || {};

      if (!variantId || !quantity || quantity <= 0) {
        return reply.status(422).send({
          type: 'https://errors.platform.example/validation.invalid_input',
          title: 'Validation Failed',
          status: 422,
          code: 'validation.invalid_input',
          detail: 'variantId and a positive quantity are required',
        });
      }

      await opts.addItemToCartUseCase.execute({
        tenantId,
        cartId: request.params.id,
        variantId,
        quantity,
      });

      return reply.status(204).send();
    },
  );

  // 6. POST /api/v1/orders
  fastify.post<{ Body: { cartId: string; customerId: string; idempotencyKey?: string } }>(
    '/api/v1/orders',
    async (request, reply) => {
      const { tenantId } = extractTenantContext(request, opts.tokenService);
      const { cartId, customerId, idempotencyKey } = request.body || {};

      if (!cartId || !customerId) {
        return reply.status(422).send({
          type: 'https://errors.platform.example/validation.invalid_input',
          title: 'Validation Failed',
          status: 422,
          code: 'validation.invalid_input',
          detail: 'cartId and customerId are required',
        });
      }

      const result = await opts.createOrderFromCartUseCase.execute({
        tenantId,
        cartId,
        customerId,
        idempotencyKey: idempotencyKey || `order-idem-${cartId}`,
      });

      return reply.status(201).send(result);
    },
  );

  // 7. GET /api/v1/orders/:id
  fastify.get<{ Params: { id: string } }>('/api/v1/orders/:id', async (request, reply) => {
    const { tenantId } = extractTenantContext(request, opts.tokenService);
    const result = await opts.getOrderUseCase.execute(tenantId, request.params.id);
    return reply.status(200).send(result);
  });
};
