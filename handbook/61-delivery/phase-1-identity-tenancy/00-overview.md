# فاز ۱: Identity + Tenancy + Authorization

## هدف فاز

ساخت اولین برش عمودی واقعی پلتفرم:

```text
Register
 -> Email Verification
 -> Login
 -> Session
 -> Tenant Context
 -> Membership
 -> Authorization
 -> Tenant-safe API response
```

در پایان این فاز، کاربر انسانی می‌تواند در چند Tenant عضو باشد، وارد شود، Tenant فعال را انتخاب کند، و هیچ درخواست معتبر یا نامعتبری نتواند داده Tenant دیگر را ببیند.

## خروجی قابل دمو

1. ثبت‌نام با Tenant اولیه
2. دریافت لینک تأیید در Mailpit
3. ورود با رمز
4. دریافت Access Token و Refresh Cookie
5. مشاهده User و Membershipها
6. ساخت Tenant دوم
7. سوییچ بین دو Tenant
8. اجرای endpoint محافظت‌شده
9. تلاش برای دسترسی Tenant اشتباه و دریافت پاسخ امن
10. Logout و شکست Refresh بعد از revoke

## خارج از دامنه

OAuth Providerها، Passkey، SSO/SAML، Customer/Shopper، Billing، Commerce، AI، MCP، Plugin و Marketplace.
