# Gate و دمو فاز ۵

## Acceptance

- [ ] Admin با Tenant A محصول می‌سازد.
- [ ] Tenant B همان Product ID را نمی‌بیند.
- [ ] Product در storefront صحیح نمایش داده می‌شود.
- [ ] تغییر Product بعد از projection در storefront دیده می‌شود.
- [ ] Guest Cart ساخته می‌شود.
- [ ] قیمت هنگام checkout دوباره خوانده می‌شود.
- [ ] stock=10 و 50 checkout هم‌زمان حداکثر 10 سفارش موفق می‌دهد.
- [ ] payment failure reservation را release می‌کند.
- [ ] retry checkout سفارش جدید نمی‌سازد.
- [ ] customer فقط Order خودش را می‌بیند.
- [ ] draft و archived در storefront public دیده نمی‌شوند.
- [ ] p95 محصول cache hit زیر 100ms است.

## Demo

```text
1. Login as Tenant Owner
2. Create product with one variant
3. Set inventory = 10
4. Open public storefront by host
5. Add product to guest cart
6. Checkout with Idempotency-Key
7. Show pending order
8. Confirm fake payment
9. Show paid order
10. Retry same checkout key
11. Show same result, no duplicate order
12. Run 50 concurrent checkout requests
13. Show only 10 successes
14. Switch Tenant and show isolation
15. Update product and show Read Model refresh
```
