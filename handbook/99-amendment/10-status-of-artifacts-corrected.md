# وضعیت واقعی artefactها (تنها مرجع وضعیت)

> جایگزین `10-architecture/debt/01-status-of-artifacts.md` و باطل‌کننده تیک‌های `00-executive/05-completeness-check.md`.

## واژگان

```text
SPEC              فقط سند و قرارداد
SKELETON          نمونه کد، اجرانشده
CODE-READY        کد اصلاح‌شده موجود است، هنوز در مخزن اجرا نشده
IMPLEMENTED       کد + تست سبز
PRODUCTION-READY  observability، security، rollback، load سبز
```

## وضعیت بعد از این اصلاحیه

| بخش | قبل | بعد از اصلاحیه | شاهد |
| --- | --- | --- | --- |
| Platform vision | SPEC | SPEC | اسناد درست، تغییر لازم نداشت |
| Architecture contracts | SPEC | SPEC (اصلاح‌شده) | ۷ ADR جدید |
| Phase map | متناقض | SPEC واحد | `05-canonical-phase-map.md` |
| DB roles و grants | غایب | CODE-READY | `0000_bootstrap_roles.sql` |
| RLS core | ناقص و ناامن | CODE-READY | `0010_rls_hardening.sql` |
| Ledger integrity | غایب | CODE-READY | `0011_ledger_integrity.sql` |
| Outbox lifecycle | SKELETON معیوب | CODE-READY | `0012` + publisher جدید |
| Quota service | اجرانشدنی | CODE-READY | `quota-service.ts` |
| Authorization | سه مسیر شکسته | CODE-READY | `authorization.ts` |
| Unit of Work | دو نسخه موازی | CODE-READY | `unit-of-work.ts` |
| Test harness | غایب | CODE-READY | `tests/helpers/index.ts` |
| Error catalog | ناقص | SPEC کامل | `errors.md` v2 |
| Workspace و CI | غیرقابل اجرا | CODE-READY | `pnpm-workspace.yaml`، `turbo.json` |
| NestJS API | SKELETON | SKELETON | هنوز T-09 |
| Worker app | SKELETON | SKELETON | هنوز T-10 |
| Web app | SPEC | SPEC | فاز بعد |
| Identity | SPEC | SPEC | فاز P-IDENTITY |
| Commerce | SPEC (دو بار) | SPEC (نیازمند ادغام) | T-22 |
| Notifications | SPEC | SPEC | فاز P-RELIABILITY |
| Billing | SPEC | SPEC + یکپارچگی دفتر | `0011` |
| AI / MCP / Plugins | SPEC | SPEC | دست نزدم، درست است |

## جمله صریح

این بسته هنوز یک repository قابل اجرا نیست. اما برای اولین بار، فهرست دقیق کارهای باقی‌مانده و کد اصلاحی آماده کپی موجود است.
