# API Contract Commerce MVP

## Admin

```text
POST   /api/v1/products
GET    /api/v1/products
GET    /api/v1/products/:id
PATCH  /api/v1/products/:id
POST   /api/v1/products/:id/archive
POST   /api/v1/products/:id/variants
PATCH  /api/v1/products/:id/inventory
GET    /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/orders/:id/cancel
```

## Storefront

```text
GET  /storefront/v1/store
GET  /storefront/v1/products/:slug
GET  /storefront/v1/products
POST /storefront/v1/customers/guest
POST /storefront/v1/cart
GET  /storefront/v1/cart
POST /storefront/v1/cart/lines
PATCH /storefront/v1/cart/lines/:lineId
DELETE /storefront/v1/cart/lines/:lineId
POST /storefront/v1/checkout
GET  /storefront/v1/orders/:number
```

## Idempotency

`POST /checkout` اجباری به header زیر نیاز دارد:

```text
Idempotency-Key: <opaque client key>
```

تکرار همان key باید همان result قبلی را برگرداند و سفارش جدید نسازد.

## Error codes

```text
commerce.product_not_found
commerce.product_slug_conflict
commerce.inventory_insufficient
commerce.cart_empty
commerce.price_changed
commerce.order_not_found
commerce.order_not_cancellable
commerce.checkout_in_progress
commerce.payment_failed
```
