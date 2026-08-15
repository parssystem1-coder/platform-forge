export class ProductNotFoundError extends Error {
  readonly code = 'commerce.product_not_found';
  readonly status = 404;
  constructor(productId: string) {
    super(`Product ${productId} not found`);
  }
}

export class ProductSlugAlreadyUsedError extends Error {
  readonly code = 'commerce.slug_already_used';
  readonly status = 409;
  constructor(slug: string) {
    super(`Product slug '${slug}' is already in use`);
  }
}

export class VariantSkuAlreadyUsedError extends Error {
  readonly code = 'commerce.sku_already_used';
  readonly status = 409;
  constructor(sku: string) {
    super(`Variant SKU '${sku}' is already in use`);
  }
}

export class InsufficientInventoryError extends Error {
  readonly code = 'commerce.insufficient_inventory';
  readonly status = 409;
  constructor(sku: string, requested: number, available: number) {
    super(`Insufficient inventory for SKU '${sku}': requested ${requested}, available ${available}`);
  }
}

export class CartNotFoundError extends Error {
  readonly code = 'commerce.cart_not_found';
  readonly status = 404;
  constructor(cartId: string) {
    super(`Cart ${cartId} not found`);
  }
}

export class OrderNotFoundError extends Error {
  readonly code = 'commerce.order_not_found';
  readonly status = 404;
  constructor(orderId: string) {
    super(`Order ${orderId} not found`);
  }
}

export class InvalidOrderStatusTransitionError extends Error {
  readonly code = 'commerce.invalid_status_transition';
  readonly status = 400;
  constructor(from: string, to: string) {
    super(`Cannot transition order status from '${from}' to '${to}'`);
  }
}
