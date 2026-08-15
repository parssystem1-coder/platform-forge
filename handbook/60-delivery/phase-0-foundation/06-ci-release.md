# ۰.۶ CI و Release Baseline

## Pipeline

```text
install
 -> lint
 -> typecheck
 -> unit tests
 -> integration tests با Postgres واقعی
 -> e2e tests
 -> tenant leak suite
 -> dependency boundaries
 -> OpenAPI drift check
 -> migration check
 -> security scan
```

## Release

```text
build artifact
 -> run backward-compatible migrations
 -> deploy API/worker
 -> readiness check
 -> shift traffic
```

## Definition of Done

- [ ] PR بدون verify سبز merge نمی‌شود
- [ ] migration قبل از deploy بررسی می‌شود
- [ ] rollback plan وجود دارد
- [ ] secrets در CI mask هستند
- [ ] image و dependency scan اجرا می‌شود
