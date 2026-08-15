# قرارداد Use Caseهای فاز ۵

## CreateProduct

### Input

```ts
{
  tenantId: string;
  actor: ActorContext;
  title: string;
  slug: string;
  description?: string;
  variants: Array<{ sku: string; priceMinor: bigint; currency: string }>;
}
```

### Side effects

- Product write
- Audit `commerce.product.created`
- Outbox `commerce.product_created`

## GetStorefrontProduct

### Input

```ts
{ host: string; slug: string }
```

### Rules

- Tenant فقط از host/domain mapping
- query فقط Read Model
- header tenant نادیده گرفته می‌شود
- archived/draft برای public برنمی‌گردد

## CreateOrder

### Input

```ts
{
  tenantId: string;
  customerId?: string;
  guestSessionId?: string;
  cartId: string;
  idempotencyKey: string;
}
```

### Transaction

```text
load cart
 -> re-read products/variants
 -> validate prices/status
 -> reserve inventory atomically
 -> create pending order
 -> snapshot lines
 -> append audit/outbox
 -> commit
```

Payment provider بیرون transaction اجرا می‌شود.

## ConfirmPayment

### Rules

- fake/manual adapter در فاز ۵
- callback idempotent
- فقط pending به paid می‌رود
- confirmation دوباره اثر جدید ندارد
- در failure reservation release می‌شود
