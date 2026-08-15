# Gate واقعی فاز P-DEBT

> تفاوت با `64-delivery/phase-4-architecture-debt/05-final-review.md`:
> آن فرم، checkbox دارد. این فرم، شاهد می‌خواهد. تیک بدون شاهد پذیرفته نیست.

## بخش ۱: امنیت (مسدودکننده)

| معیار | شاهد قابل قبول |
| --- | --- |
| هیچ جدول `tenant_id` بدون FORCE RLS | خروجی کوئری ممیزی در لاگ CI |
| هیچ پالیسی بدون `WITH CHECK` | خروجی `pg_policies` |
| نقش app مالک نیست و BYPASSRLS ندارد | دو تست در tenant-leak.spec |
| `UPDATE` تغییر `tenant_id` fail می‌شود | تست اختصاصی با دو مستاجر |
| `INSERT` با tenant غلط fail می‌شود | تست اختصاصی |
| audit قابل تغییر نیست | تست: `UPDATE audit_logs` خطای دسترسی بدهد |
| دفتر مالی نامتوازن commit نمی‌شود | تست: entry یک‌طرفه در COMMIT رد شود |

## بخش ۲: قابلیت اجرا

| معیار | شاهد |
| --- | --- |
| clone تمیز روی ماشین جدید | لاگ CI روی runner تازه |
| `pnpm install --frozen-lockfile` | لاگ |
| `pnpm verify` سبز | لاگ، شامل boundaries و contract:drift |
| API و Worker مستقل start/stop | خروجی `/healthz` و `/readyz` |
| worker بعد از kill -9 رخداد را ادامه می‌دهد | تست crash با قطع واقعی process |
| انتشار تکراری اثر دوباره ندارد | تست با `processed_events` |
| drift در OpenAPI یا errors باعث fail می‌شود | یک PR عمداً خراب که قرمز شده |

## بخش ۳: حاکمیت

| معیار | شاهد |
| --- | --- |
| یک نقشه فاز در کل مخزن | grep برای «فاز جاری» یک نتیجه بدهد |
| `ARCHITECTURE_STATUS.md` پرشده با شاهد | هر ردیف یک لینک دارد |
| هیچ P0 باز | رجیستری یافته‌ها با وضعیت بسته |

## تصمیم نهایی

- [ ] **PASS**: فاز `P-IDENTITY` مجاز است
- [ ] **HOLD**: حداقل یک معیار بخش ۱ باز است
- [ ] **EXCEPTION**: با ADR، مالک مشخص و تاریخ بازبینی

> بخش ۱ exception قبول نمی‌کند. نشت مستاجر موضوع مذاکره نیست.
