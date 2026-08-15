# فاز بعد از Features + Plans

## فاز بعدی: Billing + Subscription + Ledger

شرط شروع:

- PlanVersion و Feature Resolver PASS شده باشند.
- حداقل سه Plan واقعی و قیمت‌های واقعی مشخص شده باشند.
- Payment Provider انتخاب شده باشد.
- ارز و کشور بازار اولیه مشخص باشد.
- سیاست Trial، grace period و cancellation تأیید شده باشد.

خروجی:

- Subscription lifecycle
- Invoice
- Payment intent و webhook
- Refund و credit
- Proration پایه
- Double-entry ledger
- Reconciliation job
- Downgrade/upgrade واقعی
