# 03. Tech Stack

## 3.1 Backend

### Runtime
- Node.js 22 LTS
- TypeScript 5.x
- pnpm 9+

### Framework
- NestJS 11

**چرا NestJS؟**
- ساختار ماژولی روشن
- DI مناسب برای مرزهای معماری
- اکوسیستم mature برای config, OpenAPI, health
- مناسب برای تیم‌های چندنفره، نه فقط solo hacking

---

## 3.2 Database

### Primary DB
- PostgreSQL 16+

### Extensions
- `pgcrypto` برای crypto helpers
- `citext` برای case-insensitive email
- `uuid-ossp` فقط در صورت نیاز legacy
- `pgvector` فقط نصب می‌شود، استفاده‌اش فعلاً خارج از دامنه

**چرا PostgreSQL؟**
- RLS
- تراکنش‌های قوی
- JSONB برای تنظیمات سبک
- full text basics
- اکوسیستم عالی

---

## 3.3 ORM / DB access

- **Drizzle ORM** + SQL-first migrations
- `node-postgres` pool

**چرا Drizzle نه Prisma؟**
- کنترل بهتر روی SQL واقعی
- friction کمتر برای RLS و `SET LOCAL`
- مناسب‌تر برای پروژه‌ای که معماری و قرارداد SQL برایش مهم است

قانون:
- Repositoryها اجازه دارند برای queryهای حساس از SQL صریح استفاده کنند.
- ORM ابزار است، نه مرجع معماری.

---

## 3.4 Cache / transient infra

- Redis 7+

استفاده در گام اول:
- rate limiting
- refresh adjunct state (اختیاری)
- idempotency short-term cache
- locks سبک

Redis منبع حقیقت نیست.
اگر Redis پاک شد، سیستم نباید داده‌ی دائمی از دست بدهد.

---

## 3.5 Auth / Crypto

- `argon2` برای Argon2id
- `otplib` برای TOTP
- `jose` برای JWT signing/verification
- `crypto` استاندارد Node برای token generation

### پارامترهای Argon2id

پیش‌فرض تولید:
- memoryCost: 19456 KiB
- timeCost: 2
- parallelism: 1
- hashLength: 32

این مقادیر باید config-driven باشند تا بعداً سخت‌تر شوند.

---

## 3.6 API and validation

- REST API
- OpenAPI 3.1
- `class-validator` / `class-transformer` یا `zod` در edge layer

توصیه: برای DTOهای ورودی در Nest از Zod adapter استفاده شود اگر تیم روی type-safety سخت‌گیر است.
اگر نخواستید، class-validator هم قابل‌قبول است. اما یکدست بمانید.

**تصمیم این بسته:**
- config با `zod`
- request DTO با `class-validator`

علت: هم‌زیستی خوب با Nest و سادگی برای تیم.

---

## 3.7 Logging / tracing / metrics

- `pino` برای structured logs
- OpenTelemetry برای tracing
- Prometheus-compatible metrics endpoint
- Sentry یا معادل error tracking در محیط‌های staging/prod

---

## 3.8 Testing

- Vitest برای unit tests
- Supertest برای HTTP integration/e2e
- Testcontainers یا Docker Compose برای integration tests با Postgres/Redis واقعی

### اصل تست

RLS را با mock تست نکن.
RLS فقط با PostgreSQL واقعی معنی دارد.

---

## 3.9 Monorepo

- pnpm workspaces
- Turborepo

چرا؟
- سرعت build بهتر
- caching مناسب
- امکان تفکیک apps و packages
- توسعه‌ی تدریجی SDK و shared packages

---

## 3.10 Frontend در این گام

Frontend اولویت این بسته نیست. با این حال اسکلت پیشنهادی:
- Next.js 15
- React 19
- TypeScript

اما در گام اول، frontend می‌تواند یک client خیلی نازک یا حتی Postman collection باشد.
هسته باید backend-first کامل شود.
