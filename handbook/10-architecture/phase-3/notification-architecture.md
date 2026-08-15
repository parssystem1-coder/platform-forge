# معماری Notification Platform

## مدل

```text
Notification Request
 -> Template Resolver
 -> Preference Resolver
 -> Locale Resolver
 -> Renderer
 -> Channel Adapter
 -> Delivery Record
```

## Template variables

فقط داده whitelist شده وارد template می‌شود:

```text
user.displayName
tenant.name
order.number
order.total
verification.url
reset.url
```

Template نباید query دیتابیس یا اجرای کد داشته باشد.

## Preferenceها

| نوع | قابل خاموش کردن؟ |
|---|---|
| Email verification | خیر |
| Password reset | خیر |
| Security alert | خیر |
| Order confirmation | در فاز MVP خیر |
| Marketing | بله |
| Product update | بله |

## Delivery state machine

```text
queued -> sending -> sent
queued -> sending -> retry_scheduled -> sending
sending -> failed -> dead_letter
```

هر delivery دارای provider message id، attempt count، last error و correlation id است.

## حریم خصوصی

- token خام هرگز در delivery log نیست
- آدرس email در log mask می‌شود
- محتوای کامل ایمیل در production log نمی‌شود
- template version ثبت می‌شود
