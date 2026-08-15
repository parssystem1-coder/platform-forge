import crypto from 'node:crypto';
import type { Product, ProductVariant } from '@platform/contracts';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { QuotaService } from '../../../kernel/quota-service.js';
import type { CreateProductInput, CreateProductOutput } from './ports.js';
import { ProductNotFoundError, ProductSlugAlreadyUsedError, VariantSkuAlreadyUsedError } from '../domain/errors.js';

export class CreateProductUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly quotaService?: QuotaService | undefined,
  ) {}

  async execute(input: CreateProductInput): Promise<CreateProductOutput> {
    const productId = crypto.randomUUID();
    const variantId = crypto.randomUUID();
    const inventoryId = crypto.randomUUID();
    const outboxId = crypto.randomUUID();
    const now = new Date();

    return this.uow.withTenant(input.tenantId, async (tx) => {
      // 1. Quota reservation if QuotaService is provided
      if (this.quotaService) {
        try {
          const idempotencyKey = `product-create-${productId}`;
          const reservation = await this.quotaService.reserve(
            tx,
            input.tenantId,
            'commerce.products',
            1,
            idempotencyKey,
          );
          await this.quotaService.commit(tx, reservation, 1);
        } catch (e: any) {
          // If quota not configured, proceed, else rethrow
          if (e?.code === 'billing.quota_exceeded') throw e;
        }
      }

      // 2. Check slug uniqueness
      const existingSlug = await tx.query<{ id: string }>(
        'SELECT id FROM products WHERE slug = $1 AND tenant_id = $2;',
        [input.slug.toLowerCase().trim(), input.tenantId],
      );
      if (existingSlug.length > 0) {
        throw new ProductSlugAlreadyUsedError(input.slug);
      }

      // 3. Check SKU uniqueness
      const existingSku = await tx.query<{ id: string }>(
        'SELECT id FROM product_variants WHERE sku = $1 AND tenant_id = $2;',
        [input.sku.trim(), input.tenantId],
      );
      if (existingSku.length > 0) {
        throw new VariantSkuAlreadyUsedError(input.sku);
      }

      // 4. Insert Product
      await tx.query(
        `INSERT INTO products (id, tenant_id, slug, title, description, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $6);`,
        [productId, input.tenantId, input.slug.toLowerCase().trim(), input.title, input.description ?? null, now],
      );

      // 5. Insert Variant
      await tx.query(
        `INSERT INTO product_variants (id, tenant_id, product_id, sku, price_minor, currency, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7);`,
        [variantId, input.tenantId, productId, input.sku.trim(), input.priceMinor, input.currency, now],
      );

      // 6. Insert Inventory Item
      const initialStock = input.initialStock ?? 0;
      await tx.query(
        `INSERT INTO inventory_items (id, tenant_id, variant_id, on_hand, reserved, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 0, $5, $5);`,
        [inventoryId, input.tenantId, variantId, initialStock, now],
      );

      // 7. Insert Outbox Event
      await tx.query(
        `INSERT INTO outbox_events (
           id, event_type, event_version, aggregate_type, aggregate_id,
           tenant_id, payload, correlation_id, occurred_at, status
         ) VALUES ($1, 'commerce.product_created', 1, 'product', $2, $3, $4, $5, $6, 'pending');`,
        [
          outboxId,
          productId,
          input.tenantId,
          JSON.stringify({
            productId,
            slug: input.slug,
            title: input.title,
            variantId,
            sku: input.sku,
            priceMinor: input.priceMinor,
            currency: input.currency,
          }),
          crypto.randomUUID(),
          now,
        ],
      );

      const product: Product = {
        id: productId,
        tenantId: input.tenantId,
        slug: input.slug.toLowerCase().trim(),
        title: input.title,
        description: input.description ?? null,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      const variant: ProductVariant = {
        id: variantId,
        tenantId: input.tenantId,
        productId,
        sku: input.sku.trim(),
        priceMinor: input.priceMinor,
        currency: input.currency,
        createdAt: now,
        updatedAt: now,
      };

      return { product, variant };
    });
  }
}

export class ListProductsUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(tenantId: string): Promise<Array<Product & { variants: ProductVariant[] }>> {
    return this.uow.withTenant(tenantId, async (tx) => {
      const products = await tx.query<Product>(
        `SELECT id, tenant_id AS "tenantId", slug, title, description, status,
                created_at AS "createdAt", updated_at AS "updatedAt"
           FROM products
          WHERE tenant_id = $1 AND status <> 'archived'
          ORDER BY created_at DESC;`,
        [tenantId],
      );

      if (products.length === 0) return [];

      const variants = await tx.query<ProductVariant>(
        `SELECT id, tenant_id AS "tenantId", product_id AS "productId", sku,
                price_minor AS "priceMinor", currency, created_at AS "createdAt",
                updated_at AS "updatedAt"
           FROM product_variants
          WHERE tenant_id = $1;`,
        [tenantId],
      );

      const variantMap = new Map<string, ProductVariant[]>();
      for (const v of variants) {
        const list = variantMap.get(v.productId) ?? [];
        list.push(v);
        variantMap.set(v.productId, list);
      }

      return products.map((p) => ({
        ...p,
        variants: variantMap.get(p.id) ?? [],
      }));
    });
  }
}

export class GetProductUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(tenantId: string, productIdOrSlug: string): Promise<Product & { variants: ProductVariant[] }> {
    return this.uow.withTenant(tenantId, async (tx) => {
      const rows = await tx.query<Product>(
        `SELECT id, tenant_id AS "tenantId", slug, title, description, status,
                created_at AS "createdAt", updated_at AS "updatedAt"
           FROM products
          WHERE tenant_id = $1 AND (id::text = $2 OR slug = $2);`,
        [tenantId, productIdOrSlug],
      );

      const product = rows[0];
      if (!product) {
        throw new ProductNotFoundError(productIdOrSlug);
      }

      const variants = await tx.query<ProductVariant>(
        `SELECT id, tenant_id AS "tenantId", product_id AS "productId", sku,
                price_minor AS "priceMinor", currency, created_at AS "createdAt",
                updated_at AS "updatedAt"
           FROM product_variants
          WHERE tenant_id = $1 AND product_id = $2;`,
        [tenantId, product.id],
      );

      return {
        ...product,
        variants,
      };
    });
  }
}
