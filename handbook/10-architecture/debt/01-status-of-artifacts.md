> ⚠ این فایل با `99-amendment/10-status-of-artifacts-corrected.md` جایگزین شده است.
> نسخه اصلاحی، وضعیت هر artefact را با شاهد اعلام می‌کند.

# وضعیت واقعی artefactها

این سند جلوی سوءبرداشت را می‌گیرد.

| وضعیت | معنا |
| --- | --- |
| `SPEC` | فقط سند و contract؛ implementation ندارد |
| `SKELETON` | نمونه کد یا bootstrap ناقص برای جهت‌دهی |
| `INTEGRATION-READY` | کد قابل اتصال، اما ممکن است production hardening بخواهد |
| `IMPLEMENTED` | تست‌ها و Gate مربوطه سبز است |
| `PRODUCTION-READY` | observability، security، rollback و load criteria سبز است |

## وضعیت فعلی بسته

| بخش | وضعیت فعلی |
| --- | --- |
| Platform vision | SPEC |
| Architecture contracts | SPEC |
| Phase 0 docs | SPEC |
| NestJS API | SKELETON |
| Worker | SKELETON |
| Web app | SPEC |
| Identity | SPEC/SKELETON |
| Tenancy/RLS | SPEC + migration sample |
| Commerce | SPEC |
| Notifications | SPEC + migration sample |
| Billing/Ledger | SPEC |
| AI/MCP/Plugins | SPEC |

> این بسته هنوز یک repository production-ready نیست. Agent باید آن را به repository واقعی تبدیل کند.
