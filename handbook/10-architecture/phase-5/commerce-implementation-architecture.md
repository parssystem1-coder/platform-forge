# معماری پیاده‌سازی Commerce فاز ۵

## مرزهای داده

```text
Operational Truth
  products
  variants
  inventory_items
  customers
  carts
  orders
  order_lines

Read Projection
  storefront_products

Never use Read Projection for:
  checkout price
  inventory availability
  order creation
  authorization
```

## مرزهای Interface

```text
Admin REST
  -> Admin Application Services

Storefront HTTP
  -> Storefront Query Services

Checkout HTTP
  -> Checkout Application Service

Worker
  -> Projector / Notification / Cleanup Use Cases
```

## مرز پرداخت

```text
CreateOrder
  -> PaymentPort.createIntent()
  -> FakePaymentAdapter in Phase 5
  -> Real provider adapter in Phase 7/8 after billing decisions
```

هیچ Product یا Order domainای نباید نام Stripe، درگاه یا HTTP client را بداند.

## Consistency

- Admin product writes: strongly consistent operational DB
- Storefront catalog: eventual, target <= 30s
- Checkout price/inventory: strongly consistent transaction
- Notification: asynchronous at-least-once
