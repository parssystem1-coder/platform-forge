# Event Contract Commerce MVP

```text
commerce.product_created
commerce.product_updated
commerce.product_archived
commerce.inventory_adjusted
commerce.inventory_reserved
commerce.inventory_released
commerce.order_created
commerce.order_paid
commerce.order_canceled
commerce.customer_created
commerce.cart_converted
```

## Consumerها

| event | consumer |
|---|---|
| product_created/updated | storefront projector |
| inventory_reserved/released | metrics و audit |
| order_created | notification، analytics آینده |
| order_paid | fulfillment آینده، notification |
| customer_created | analytics آینده |
