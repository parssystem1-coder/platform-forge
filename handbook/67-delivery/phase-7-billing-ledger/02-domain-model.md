# مدل دامنه Billing

## Subscription

```text
trialing -> active -> past_due -> paused -> canceled -> expired
              |          |
              |          +-> active after successful retry
              +-> paused -> active
```

Subscription به `plan_version_id` اشاره می‌کند و snapshot قیمت دوره را نگه می‌دارد.

## Invoice

Invoice سند immutable است:

- invoice number
- tenant
- subscription
- subtotal
- discount
- tax
- total
- currency
- due date
- status
- line snapshots

اصلاح فاکتور با credit note انجام می‌شود، نه update تاریخی.

## Payment

Payment lifecycle:

```text
created -> pending -> succeeded
created -> pending -> failed
succeeded -> refunded
```

## Ledger

```text
Ledger Entry
  -> Debit Line
  -> Credit Line
```

در هر Entry مجموع debit و credit باید برابر باشد.

## Upgrade

1. محاسبه قیمت جدید
2. محاسبه proration
3. ایجاد invoice یا payment intent
4. پرداخت
5. ثبت Ledger
6. تغییر subscription
7. invalidate feature cache
8. Audit و Outbox

## Downgrade

- اگر فوری نیست، `pending_change` نگه می‌داریم.
- اگر فوری است، Feature جدید فوراً فعال می‌شود.
- داده حذف نمی‌شود.
- محدودیت فقط روی create/action اعمال می‌شود.
- invoice و effective features قابل توضیح باقی می‌مانند.
