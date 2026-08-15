# قرارداد Runtime Commerce

## Headers

```text
Authorization: Bearer <tenant-user-access-token>  # admin routes
X-Tenant-Id: <tenant-id>                           # candidate only
Idempotency-Key: <opaque key>                      # checkout/payment writes
Host: shop.example.com                             # storefront tenant source
```

## Admin routes

```text
POST   /api/v1/products
PATCH  /api/v1/products/:id
POST   /api/v1/products/:id/archive
POST   /api/v1/products/:id/variants
PATCH  /api/v1/products/:id/inventory
```

## Storefront routes

```text
GET    /storefront/v1/products/:slug
POST   /storefront/v1/cart
GET    /storefront/v1/cart
POST   /storefront/v1/cart/lines
PATCH  /storefront/v1/cart/lines/:lineId
DELETE /storefront/v1/cart/lines/:lineId
POST   /storefront/v1/checkout
POST   /storefront/v1/payment/confirm
GET    /storefront/v1/orders/:number
```

## Error mapping

```text
commerce.product_not_found       404
commerce.inventory_insufficient  409
commerce.price_changed           409
commerce.cart_empty              422
commerce.checkout_duplicate      200 with original result
commerce.payment_failed          402
commerce.order_not_found         404
```
