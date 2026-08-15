# ۰.۱ Bootstrap مخزن

## ساختار

```text
platform/
├── apps/api
├── apps/worker
├── apps/web
├── modules/platform-kernel
├── modules/identity
├── modules/tenancy
├── modules/access-control
├── packages/config
├── packages/types
├── packages/testing
├── migrations
├── contracts
├── docs
└── tests
```

## کارهای اجرایی

1. فعال کردن pnpm workspace
2. اضافه کردن Turborepo
3. TypeScript strict
4. ESLint و Prettier
5. Vitest و Supertest
6. dependency-cruiser
7. commit hooks برای lint و typecheck
8. scripts استاندارد: `dev`, `build`, `test`, `verify`, `db:migrate`

## Definition of Done

- [ ] `pnpm install` موفق است
- [ ] `pnpm verify` بدون سرویس خارجی اجرا می‌شود
- [ ] import مرز داخلی ماژول‌ها در CI رد می‌شود
- [ ] یک test نمونه سبز است
- [ ] README اجرای پروژه را از صفر توضیح می‌دهد
