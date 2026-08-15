# لیست تسک اولویت‌دار (معادل لیست ClickUp)

> ۲۶ تسک، هر کدام ≤۴ ساعت، مرتب بر اساس ترتیب اجرا.
> Priority: Urgent = امنیتی، High = مسدودکننده اجرا، Normal = درستی، Low = حاکمیت.

| # | تسک | Priority | تخمین | یافته |
| --- | --- | --- | --- | --- |
| 1 | نقش‌های دیتابیس و grantها: جدا کردن app از owner | Urgent | 3h | D-003، F-032 |
| 2 | RLS روی `outbox_events` و `outbox_dead_letters` با نقش worker | Urgent | 3h | F-001، F-002 |
| 3 | افزودن `WITH CHECK` به تمام پالیسی‌های فاز ۱ تا ۳ | Urgent | 3h | F-006 |
| 4 | غیرقابل تغییر کردن `audit_logs` | Urgent | 2h | F-007 |
| 5 | `tenant_id` و RLS و توازن دفتر مالی | Urgent | 4h | F-004، F-005، F-009، F-031 |
| 6 | تابع واحد `app_current_tenant()` با nullif | Urgent | 2h | F-008 |
| 7 | اصلاح پالیسی `tenants` و مسیر provisioning | Urgent | 4h | F-033 |
| 8 | workspace واقعی pnpm و turbo و lockfile | High | 4h | D-002 |
| 9 | API واقعی NestJS با healthz و readyz و Problem Details | High | 4h | D-001 |
| 10 | Worker مستقل با graceful shutdown | High | 4h | D-001، D-009 |
| 11 | migration runner و `db:reset` قابل تکرار | High | 3h | D-002 |
| 12 | harness تست واقعی و سبز کردن tenant-leak | High | 4h | D-005، F-003 |
| 13 | یکی کردن `withTenant` و حذف `withoutTenant` | High | 3h | F-016، F-027 |
| 14 | رفع سه باگ `quota-service` و تست همزمانی | Normal | 4h | F-010، F-011، F-012 |
| 15 | بازنویسی outbox publisher با claim lease | Normal | 4h | F-013، F-014، D-006 |
| 16 | اصلاح authorize برای machine و staff و customer | Normal | 4h | F-015، F-029، F-030 |
| 17 | خارج کردن سهمیه از authorize | Normal | 3h | F-022 |
| 18 | `packages/contracts` و اجبار مرزها در CI | Normal | 3h | F-017 |
| 19 | کاتالوگ خطای v2 و تست drift | Normal | 3h | F-020 |
| 20 | OpenAPI تنها مرجع و route drift test | Normal | 4h | F-021، D-008 |
| 21 | نقشه فاز واحد و پاکسازی README | Low | 2h | F-023، F-024 |
| 22 | بازسازی پوشه‌های delivery و ادغام Commerce | Low | 3h | F-025، F-026 |
| 23 | معنای تیک در completeness-check و ARCHITECTURE_STATUS | Low | 2h | F-019 |
| 24 | sequence شماره سفارش به ازای مستاجر | Normal | 3h | F-028 |
| 25 | deferrable کردن FK نشست و توکن | Low | 1h | F-034 |
| 26 | Gate فاز P-DEBT و اجازه شروع P-IDENTITY | Low | 2h | F-018 |

**جمع تخمین: حدود ۸۰ ساعت کار موثر.**
