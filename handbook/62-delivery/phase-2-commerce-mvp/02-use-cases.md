# Use Caseهای فاز ۲

## Admin

```text
CreateProduct
UpdateProduct
ArchiveProduct
CreateVariant
SetInventory
ListProducts
GetProduct
ListOrders
GetOrder
CancelOrder
```

## Storefront

```text
GetStorefront
GetProductBySlug
SearchProductsBasic
CreateGuestCustomer
GetOrCreateCart
AddCartLine
UpdateCartLine
RemoveCartLine
StartCheckout
CreateOrder
GetMyOrder
```

## Rules

- Create/Update/Archive Product از `authorize()` عبور می‌کند.
- Storefront catalog از Read Model می‌خواند.
- Checkout از Read Model قیمت نمی‌خواند؛ منبع حقیقت عملیاتی را می‌خواند.
- Order line قیمت و title را snapshot می‌کند.
- Cart موجودی را رزرو نمی‌کند.
- Checkout رزرو اتمیک با TTL ایجاد می‌کند.
- Payment failure سفارش را paid نمی‌کند و reservation را release می‌کند.
- retry با idempotency key سفارش تکراری نمی‌سازد.
