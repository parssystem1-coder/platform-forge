# 13. CI/CD

## 13.1 هدف

CI باید صرفاً lint runner نباشد. باید جلوی خراب شدن architecture را بگیرد.

---

## 13.2 Pipeline پیشنهادی PR

1. install dependencies
2. lint
3. typecheck
4. unit tests
5. integration tests
6. e2e tests
7. architecture boundary checks
8. OpenAPI drift check
9. migration sanity check
10. dependency vulnerability scan

---

## 13.3 Migration policy

- migrationها در PR review می‌شوند
- هر migration باید idempotent-ish deployment safe باشد
- destructive migration در گام اول ممنوع مگر با plan واضح

### deploy sequence

1. build artifact
2. run migrations
3. start new version
4. readiness pass
5. shift traffic

اگر migration backward compatible نیست، deploy دو مرحله‌ای لازم است.

---

## 13.4 Environments

- local
- test
- staging
- production

staging باید تا حد ممکن production-like باشد، مخصوصاً در auth و cookies.

---

## 13.5 Secrets in CI

- injected securely
- masked in logs
- short-lived tokens preferred

---

## 13.6 Release quality gates

برای release شدن staging/prod:
- verify سبز
- migration review approved
- security-sensitive diff reviewed by second engineer
- rollback plan documented if auth/session touched
