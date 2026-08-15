# Gate فاز ۰

فاز ۰ فقط وقتی قبول است که همه موارد زیر سبز باشند:

- [ ] توسعه‌دهنده جدید پروژه را محلی بالا می‌آورد
- [ ] API و Worker جدا اجرا می‌شوند
- [ ] Migration core اجرا می‌شود
- [ ] DB roleها امن هستند
- [ ] RLS و Tenant Leak Suite سبز هستند
- [ ] `/healthz` و `/readyz` جواب صحیح می‌دهند
- [ ] log ساختاریافته و correlation-aware است
- [ ] architecture boundary در CI enforce می‌شود
- [ ] Outbox publisher نمونه کار می‌کند
- [ ] OpenAPI و error catalog در repo هستند
- [ ] مستندات فاز ۰ با کد هم‌خوان هستند

پس از این Gate، فاز ۱ یعنی Identity + Tenancy + Authorization شروع می‌شود.
