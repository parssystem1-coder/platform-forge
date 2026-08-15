import { describe, it, expect } from 'vitest';
import { createApp } from '../../app.js';
import type { Pool, Tx } from '@platform/contracts';

describe('Commerce API Endpoints', () => {
  const tenantId = 'tenant-comm-123';

  it('POST /api/v1/products creates product, variant and inventory in tenant context', async () => {
    const executedQueries: string[] = [];

    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        const mockTx: Tx = {
          async query<R>(sql: string) {
            executedQueries.push(sql);
            if (sql.includes('SELECT id FROM products WHERE slug')) return [] as R[];
            if (sql.includes('SELECT id FROM product_variants WHERE sku')) return [] as R[];
            return [] as R[];
          },
        };
        return fn(mockTx);
      },
    };

    const app = await createApp({ pool: mockPool });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: {
        'x-tenant-id': tenantId,
      },
      payload: {
        slug: 'pro-shoes',
        title: 'Professional Running Shoes',
        priceMinor: 15000,
        currency: 'USD',
        sku: 'SHOE-PRO-01',
        initialStock: 50,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.product.id).toBeDefined();
    expect(body.product.slug).toBe('pro-shoes');
    expect(body.variant.sku).toBe('SHOE-PRO-01');

    expect(executedQueries.some((q) => q.includes('INSERT INTO products'))).toBe(true);
    expect(executedQueries.some((q) => q.includes('INSERT INTO product_variants'))).toBe(true);
    expect(executedQueries.some((q) => q.includes('INSERT INTO inventory_items'))).toBe(true);
    expect(executedQueries.some((q) => q.includes('INSERT INTO outbox_events'))).toBe(true);
  });

  it('POST /api/v1/products rejects duplicate slug with 409', async () => {
    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        const mockTx: Tx = {
          async query<R>(sql: string) {
            if (sql.includes('SELECT id FROM products WHERE slug')) {
              return [{ id: 'prod-existing' }] as R[];
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
      url: '/api/v1/products',
      headers: {
        'x-tenant-id': tenantId,
      },
      payload: {
        slug: 'pro-shoes',
        title: 'Professional Shoes',
        priceMinor: 15000,
        currency: 'USD',
        sku: 'SHOE-02',
      },
    });

    expect(res.statusCode).toBe(409);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const body = JSON.parse(res.body);
    expect(body.code).toBe('commerce.slug_already_used');
  });

  it('Cart and Order lifecycle: create cart, add item, and checkout to order', async () => {
    const executedQueries: string[] = [];

    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        const mockTx: Tx = {
          async query<R>(sql: string) {
            executedQueries.push(sql);
            if (sql.includes('SELECT id, price_minor FROM product_variants')) {
              return [{ id: 'var-1', price_minor: 5000 }] as R[];
            }
            if (sql.includes('SELECT id FROM carts WHERE id')) {
              return [{ id: 'cart-123' }] as R[];
            }
            if (sql.includes('SELECT id, currency, status FROM carts')) {
              return [{ id: 'cart-123', currency: 'USD', status: 'active' }] as R[];
            }
            if (sql.includes('FROM cart_lines cl')) {
              return [
                {
                  variant_id: 'var-1',
                  quantity: 2,
                  added_price_minor: 5000,
                  sku: 'ITEM-1',
                  title: 'Sample Item',
                },
              ] as R[];
            }
            if (sql.includes('UPDATE inventory_items')) {
              return [{ id: 'inv-1', on_hand: 10, reserved: 2 }] as R[];
            }
            return [] as R[];
          },
        };
        return fn(mockTx);
      },
    };

    const app = await createApp({ pool: mockPool });

    // 1. Create Cart
    const cartRes = await app.inject({
      method: 'POST',
      url: '/api/v1/carts',
      headers: { 'x-tenant-id': tenantId },
      payload: { customerId: 'cust-1', currency: 'USD' },
    });
    expect(cartRes.statusCode).toBe(201);
    const cart = JSON.parse(cartRes.body);
    expect(cart.id).toBeDefined();

    // 2. Add line to cart
    const lineRes = await app.inject({
      method: 'POST',
      url: `/api/v1/carts/${cart.id}/lines`,
      headers: { 'x-tenant-id': tenantId },
      payload: { variantId: 'var-1', quantity: 2 },
    });
    expect(lineRes.statusCode).toBe(204);

    // 3. Checkout to create order
    const orderRes = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { 'x-tenant-id': tenantId },
      payload: { cartId: cart.id, customerId: 'cust-1' },
    });

    expect(orderRes.statusCode).toBe(201);
    const orderBody = JSON.parse(orderRes.body);
    expect(orderBody.order.id).toBeDefined();
    expect(orderBody.order.orderNumber).toContain('ORD-');
    expect(orderBody.order.totalMinor).toBe(10000);
    expect(orderBody.lines).toHaveLength(1);

    expect(executedQueries.some((q) => q.includes('INSERT INTO orders'))).toBe(true);
    expect(executedQueries.some((q) => q.includes('INSERT INTO order_lines'))).toBe(true);
    expect(executedQueries.some((q) => q.includes("UPDATE carts SET status = 'converted'"))).toBe(true);
    expect(executedQueries.some((q) => q.includes('commerce.order_created'))).toBe(true);
  });
});
