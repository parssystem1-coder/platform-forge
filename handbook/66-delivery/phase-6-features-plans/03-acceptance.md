# معیار پذیرش فاز ۶

- [ ] PlanVersion published immutable است.
- [ ] ساخت Version جدید شرایط Tenant قدیمی را تغییر نمی‌دهد.
- [ ] Tenant جدید فقط Version منتشرشده را می‌گیرد.
- [ ] Feature فعال با authorize اجازه می‌گیرد.
- [ ] Feature غیرفعال کد `billing.feature_not_available` و status 402 می‌دهد.
- [ ] Quota پر کد `billing.quota_exceeded` و status 429 می‌دهد.
- [ ] Downgrade هیچ Product یا Order یا Customerای را حذف نمی‌کند.
- [ ] بعد از Downgrade، read داده موجود ممکن است باقی بماند ولی create جدید محدود می‌شود.
- [ ] Override تاریخ انقضا و دلیل دارد.
- [ ] Plan و Feature تغییرات حساس Audit می‌شوند.
- [ ] resolver با cache و invalidation تست شده است.
- [ ] Tenant A نمی‌تواند Plan یا Feature Tenant B را بخواند.
