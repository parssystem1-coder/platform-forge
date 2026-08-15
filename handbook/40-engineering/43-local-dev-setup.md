# 12. Local Development Setup

## 12.1 پیش‌نیازها

- Node.js 22+
- pnpm 9+
- Docker + Docker Compose

---

## 12.2 سرویس‌های محلی

با docker compose بالا می‌آیند:
- postgres
- redis
- mailpit (برای تست ایمیل)

---

## 12.3 فایل env

از روی `.env.example` کپی کن:

```bash
cp .env.example .env
```

کلیدهای اصلی:
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`
- `EMAIL_FROM`
- `APP_BASE_URL`
- `COOKIE_SECURE`
- `ARGON2_MEMORY_COST`

---

## 12.4 دستورهای استاندارد

```bash
pnpm install
pnpm infra:up
pnpm db:migrate
pnpm dev
```

برای تست کامل:

```bash
pnpm verify
```

---

## 12.5 راه‌اندازی اولیه پیشنهادی

1. compose را بالا بیاور
2. migration اجرا کن
3. health check را بزن
4. register request تستی بزن
5. Mailpit را باز کن و verification link را بردار
6. verify کن
7. login کن
8. me و tenants را تست کن

اگر این مسیر در README اولیه نباشد، onboarding بد است.

---

## 12.6 قواعد DX

- hot reload برای api
- test watch mode
- lint/typecheck سریع
- seed اسکریپت سبک برای developer
- logs خوانا در local، JSON در CI/staging/prod

---

## 12.7 Mail strategy در local

ایمیل واقعی نفرست.
Mailpit یا stdout transport کافی است.
اما contract email sending باید همان production path را طی کند.
