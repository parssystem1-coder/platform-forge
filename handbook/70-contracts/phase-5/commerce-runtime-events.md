# رخدادهای Runtime Commerce

```text
commerce.product_created
commerce.product_updated
commerce.product_archived
commerce.inventory_adjusted
commerce.inventory_reserved
commerce.inventory_released
commerce.customer_created
commerce.cart_converted
commerce.order_created
commerce.order_payment_pending
commerce.order_paid
commerce.order_canceled
```

## Required metadata

هر event باید `eventId`, `eventVersion`, `tenantId`, `aggregateId`, `correlationId`, `causationId` و `occurredAt` داشته باشد.

## Consumers

| event | consumer |
|---|---|
| product_* | storefront projector |
| order_created | order confirmation notification |
| order_paid | receipt notification و fulfillment future |
| inventory_* | metrics و operational audit |
