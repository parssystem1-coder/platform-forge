# فاز ۷: Billing + Subscription + Ledger

## هدف

تبدیل Plan و Feature به درآمد واقعی، بدون قفل شدن به Payment Provider و بدون از دست رفتن قابلیت حسابرسی مالی.

## خروجی

```text
Tenant
 -> Select PlanVersion
 -> Trial / Subscription
 -> Invoice
 -> Payment Intent
 -> Provider Webhook
 -> Idempotent Processing
 -> Ledger Entry
 -> Effective Features
 -> Upgrade/Downgrade
 -> Reconciliation
```

## پیش‌شرط

- Feature/Plan phase PASS شده باشد.
- حداقل سه Plan و قیمت واقعی مشخص باشد.
- بازار و ارز اولیه مشخص باشد.
- Provider انتخاب شده باشد.
- سیاست Trial، grace period، cancellation و refund تأیید شده باشد.

## خارج از دامنه

Tax engine بین‌المللی، Multi-currency پیچیده، Revenue Share Marketplace، Accounting کامل، Multi-region billing و subscription usage-based پیچیده.
