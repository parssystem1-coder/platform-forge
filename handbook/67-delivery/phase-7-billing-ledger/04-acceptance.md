# معیار پذیرش Billing

- [ ] Subscription همیشه به PlanVersion مشخص pin است.
- [ ] انتشار PlanVersion جدید Subscription قدیمی را تغییر نمی‌دهد.
- [ ] Invoice بعد از نهایی شدن immutable است.
- [ ] Payment webhook خام قبل از پردازش ذخیره می‌شود.
- [ ] webhook تکراری side effect تکراری ندارد.
- [ ] webhook گم‌شده توسط reconciliation پیدا می‌شود.
- [ ] هر payment موفق دقیقاً Ledger Entry متوازن دارد.
- [ ] refund با reversing/refund entry ثبت می‌شود.
- [ ] هیچ مبلغی float نیست.
- [ ] upgrade بعد از payment موفق Feature جدید را فعال می‌کند.
- [ ] downgrade داده را حذف نمی‌کند.
- [ ] past_due طبق grace policy رفتار می‌کند.
- [ ] failure provider باعث وضعیت جعلی active نمی‌شود.
- [ ] همه تغییرات subscription و مالی Audit می‌شوند.
