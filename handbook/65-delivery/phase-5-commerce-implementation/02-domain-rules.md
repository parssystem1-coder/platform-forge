# قوانین دامنه Commerce MVP

## Product

- slug در Tenant یکتا است.
- Product آرشیو‌شده حذف فیزیکی نمی‌شود.
- Product بدون Variant قابل فعال‌سازی نیست.
- SKU در Tenant یکتا است.
- price با integer minor units ذخیره می‌شود.
- currency در هر Variant مشخص است.

## Customer

- Customer به یک Tenant تعلق دارد.
- `(tenant_id, email)` یکتا است.
- Guest می‌تواند password نداشته باشد.
- Customer به API مدیریتی دسترسی ندارد.

## Cart

- Cart متعلق به یک Tenant و یک Customer/Guest Session است.
- quantity مثبت است.
- Cart موجودی را رزرو نمی‌کند.
- تغییر قیمت هنگام Checkout باید تشخیص داده شود.

## Inventory

- `reserved <= on_hand`
- رزرو با conditional UPDATE اتمیک است.
- رزرو TTL دارد.
- پرداخت ناموفق یا انصراف، رزرو را آزاد می‌کند.

## Order

```text
pending -> paid -> fulfilled
pending -> canceled
paid -> refunded (فاز پرداخت واقعی)
```

- Order line قیمت و عنوان لحظه خرید را snapshot می‌کند.
- Order بدون Customer فقط در صورت اجازه Guest Checkout ساخته می‌شود.
- retry با همان Idempotency-Key نباید Order جدید بسازد.
