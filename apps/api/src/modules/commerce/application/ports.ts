import type { Product, ProductVariant, Order, Cart } from '@platform/contracts';

export interface CreateProductInput {
  tenantId: string;
  slug: string;
  title: string;
  description?: string | undefined;
  priceMinor: number;
  currency: string;
  sku: string;
  initialStock?: number | undefined;
}

export interface CreateProductOutput {
  product: Product;
  variant: ProductVariant;
}

export interface CreateCartInput {
  tenantId: string;
  customerId?: string | undefined;
  guestSessionId?: string | undefined;
  currency: string;
}

export interface AddItemToCartInput {
  tenantId: string;
  cartId: string;
  variantId: string;
  quantity: number;
}

export interface CreateOrderFromCartInput {
  tenantId: string;
  cartId: string;
  customerId: string;
  idempotencyKey: string;
}
