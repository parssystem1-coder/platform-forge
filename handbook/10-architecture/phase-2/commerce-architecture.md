# معماری Commerce MVP

## دو مسیر

```text
Control Plane:
Admin UI -> REST -> authorize -> Commerce Use Case -> Operational tables

Data Plane:
Shopper -> CDN/Next.js -> Storefront Read Model

Write Plane:
Checkout -> Operational Product/Inventory/Order -> Outbox -> Workers
```

## مرز مهم

```text
Storefront catalog  -> storefront_products
Checkout            -> products + variants + inventory + pricing rules
Admin               -> application services
```

هیچ‌وقت برای checkout به payload کش‌شده storefront اعتماد نکن.

## Inventory reservation

```sql
UPDATE inventory_items
SET reserved = reserved + $quantity
WHERE tenant_id = $tenant
  AND variant_id = $variant
  AND on_hand - reserved - $quantity >= 0
RETURNING *;
```

اگر zero rows برگشت، موجودی کافی نیست.

## Order creation transaction

```text
BEGIN
  validate cart
  re-read product prices
  reserve inventory
  create order pending
  create order lines with snapshots
  create payment intent record
  append order.created outbox
  append audit
COMMIT
```

Provider واقعی خارج transaction صدا زده می‌شود. Payment confirmation از مسیر webhook/adapter برمی‌گردد.
