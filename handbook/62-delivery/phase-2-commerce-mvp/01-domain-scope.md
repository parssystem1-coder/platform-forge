# دامنه Commerce MVP

## Aggregateها

### Product

- id
- tenantId
- slug
- title
- description
- status: draft | active | archived
- variants

### ProductVariant

- id
- productId
- sku
- priceMinor
- currency

### Customer

- tenantId
- email
- displayName
- status: guest | active | blocked
- password اختیاری برای guest checkout

### Cart

- tenantId
- customer/session id
- lines
- status: active | converted | abandoned

### Order

- number
- tenantId
- customerId nullable
- status: pending | paid | canceled | fulfilled
- price snapshots
- totals

### InventoryItem

- tenantId
- variantId
- onHand
- reserved

## مالکیت

- Product و Order و Inventory tenant-bound هستند.
- Customer در realm جداست و فقط به یک Tenant تعلق دارد.
- Storefront از دامنه Tenant تعیین می‌شود.
