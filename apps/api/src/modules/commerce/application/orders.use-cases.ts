import crypto from 'node:crypto';
import type { Cart, Order, OrderLine } from '@platform/contracts';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { CreateCartInput, AddItemToCartInput, CreateOrderFromCartInput } from './ports.js';
import { CartNotFoundError, OrderNotFoundError, InsufficientInventoryError } from '../domain/errors.js';

export class CreateCartUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(input: CreateCartInput): Promise<Cart> {
    const cartId = crypto.randomUUID();
    const now = new Date();

    return this.uow.withTenant(input.tenantId, async (tx) => {
      await tx.query(
        `INSERT INTO carts (id, tenant_id, customer_id, guest_session_id, status, currency, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'active', $5, $6, $6);`,
        [
          cartId,
          input.tenantId,
          input.customerId ?? null,
          input.guestSessionId ?? null,
          input.currency,
          now,
        ],
      );

      return {
        id: cartId,
        tenantId: input.tenantId,
        customerId: input.customerId ?? null,
        guestSessionId: input.guestSessionId ?? null,
        status: 'active',
        currency: input.currency,
        createdAt: now,
        updatedAt: now,
      };
    });
  }
}

export class AddItemToCartUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(input: AddItemToCartInput): Promise<void> {
    const lineId = crypto.randomUUID();
    const now = new Date();

    return this.uow.withTenant(input.tenantId, async (tx) => {
      // 1. Get Variant details
      const variantRows = await tx.query<{
        id: string;
        price_minor: number;
      }>(
        'SELECT id, price_minor FROM product_variants WHERE id = $1 AND tenant_id = $2;',
        [input.variantId, input.tenantId],
      );

      const variant = variantRows[0];
      if (!variant) {
        throw new Error('variant_not_found');
      }

      // 2. Check Cart exists
      const cartRows = await tx.query<{ id: string }>(
        'SELECT id FROM carts WHERE id = $1 AND tenant_id = $2 AND status = \'active\';',
        [input.cartId, input.tenantId],
      );
      if (cartRows.length === 0) {
        throw new CartNotFoundError(input.cartId);
      }

      // 3. Upsert Cart Line
      await tx.query(
        `INSERT INTO cart_lines (id, tenant_id, cart_id, variant_id, quantity, added_price_minor, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
         ON CONFLICT (tenant_id, cart_id, variant_id)
         DO UPDATE SET quantity = cart_lines.quantity + $5, updated_at = $7;`,
        [lineId, input.tenantId, input.cartId, input.variantId, input.quantity, variant.price_minor, now],
      );
    });
  }
}

export class CreateOrderFromCartUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(input: CreateOrderFromCartInput): Promise<{ order: Order; lines: OrderLine[] }> {
    const orderId = crypto.randomUUID();
    const outboxId = crypto.randomUUID();
    const now = new Date();
    const orderNumber = `ORD-${now.getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    return this.uow.withTenant(input.tenantId, async (tx) => {
      // 1. Fetch Cart and Cart Lines
      const cartRows = await tx.query<{
        id: string;
        currency: string;
        status: string;
      }>(
        'SELECT id, currency, status FROM carts WHERE id = $1 AND tenant_id = $2 FOR UPDATE;',
        [input.cartId, input.tenantId],
      );

      const cart = cartRows[0];
      if (!cart || cart.status !== 'active') {
        throw new CartNotFoundError(input.cartId);
      }

      const cartLines = await tx.query<{
        variant_id: string;
        quantity: number;
        added_price_minor: number;
        sku: string;
        title: string;
      }>(
        `SELECT cl.variant_id, cl.quantity, cl.added_price_minor,
                v.sku, p.title
           FROM cart_lines cl
           JOIN product_variants v ON v.id = cl.variant_id
           JOIN products p ON p.id = v.product_id
          WHERE cl.cart_id = $1 AND cl.tenant_id = $2;`,
        [input.cartId, input.tenantId],
      );

      if (cartLines.length === 0) {
        throw new Error('cart_is_empty');
      }

      let totalMinor = 0;

      // 2. Atomically check and reserve inventory for each line
      for (const line of cartLines) {
        const itemRows = await tx.query<{
          id: string;
          on_hand: number;
          reserved: number;
        }>(
          `UPDATE inventory_items
              SET reserved = reserved + $3
            WHERE tenant_id = $1 AND variant_id = $2 AND on_hand - reserved >= $3
           RETURNING id, on_hand, reserved;`,
          [input.tenantId, line.variant_id, line.quantity],
        );

        if (itemRows.length === 0) {
          throw new InsufficientInventoryError(line.sku, line.quantity, 0);
        }

        totalMinor += Number(line.added_price_minor) * line.quantity;
      }

      // 3. Insert Order
      await tx.query(
        `INSERT INTO orders (id, tenant_id, customer_id, order_number, status, currency, total_minor, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $7);`,
        [orderId, input.tenantId, input.customerId, orderNumber, cart.currency, totalMinor, now],
      );

      // 4. Insert Order Lines
      const orderLinesList: OrderLine[] = [];
      for (const line of cartLines) {
        const lineId = crypto.randomUUID();
        const lineTotal = Number(line.added_price_minor) * line.quantity;

        await tx.query(
          `INSERT INTO order_lines (id, tenant_id, order_id, variant_id, quantity, unit_price_minor, total_minor, title, sku)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
          [
            lineId,
            input.tenantId,
            orderId,
            line.variant_id,
            line.quantity,
            line.added_price_minor,
            lineTotal,
            line.title,
            line.sku,
          ],
        );

        orderLinesList.push({
          id: lineId,
          tenantId: input.tenantId,
          orderId,
          variantId: line.variant_id,
          quantity: line.quantity,
          unitPriceMinor: line.added_price_minor,
          totalMinor: lineTotal,
          title: line.title,
          sku: line.sku,
        });
      }

      // 5. Mark Cart as Converted
      await tx.query(
        'UPDATE carts SET status = \'converted\', updated_at = $1 WHERE id = $2 AND tenant_id = $3;',
        [now, input.cartId, input.tenantId],
      );

      // 6. Insert Outbox Event: commerce.order_created
      await tx.query(
        `INSERT INTO outbox_events (
           id, event_type, event_version, aggregate_type, aggregate_id,
           tenant_id, payload, correlation_id, occurred_at, status
         ) VALUES ($1, 'commerce.order_created', 1, 'order', $2, $3, $4, $5, $6, 'pending');`,
        [
          outboxId,
          orderId,
          input.tenantId,
          JSON.stringify({
            orderId,
            orderNumber,
            customerId: input.customerId,
            totalMinor,
            currency: cart.currency,
            lineCount: orderLinesList.length,
          }),
          crypto.randomUUID(),
          now,
        ],
      );

      const order: Order = {
        id: orderId,
        tenantId: input.tenantId,
        customerId: input.customerId,
        orderNumber,
        status: 'pending',
        currency: cart.currency,
        totalMinor,
        createdAt: now,
        updatedAt: now,
      };

      return { order, lines: orderLinesList };
    });
  }
}

export class GetOrderUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(tenantId: string, orderId: string): Promise<{ order: Order; lines: OrderLine[] }> {
    return this.uow.withTenant(tenantId, async (tx) => {
      const orderRows = await tx.query<Order>(
        `SELECT id, tenant_id AS "tenantId", customer_id AS "customerId", order_number AS "orderNumber",
                status, currency, total_minor AS "totalMinor",
                created_at AS "createdAt", updated_at AS "updatedAt"
           FROM orders
          WHERE id = $1 AND tenant_id = $2;`,
        [orderId, tenantId],
      );

      const order = orderRows[0];
      if (!order) {
        throw new OrderNotFoundError(orderId);
      }

      const lines = await tx.query<OrderLine>(
        `SELECT id, tenant_id AS "tenantId", order_id AS "orderId", variant_id AS "variantId",
                quantity, unit_price_minor AS "unitPriceMinor", total_minor AS "totalMinor",
                title, sku
           FROM order_lines
          WHERE order_id = $1 AND tenant_id = $2;`,
        [orderId, tenantId],
      );

      return { order, lines };
    });
  }
}
