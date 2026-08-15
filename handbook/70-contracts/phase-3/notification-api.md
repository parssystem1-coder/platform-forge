# Notification Contract فاز ۳

## Internal request

```json
{
  "notificationKey": "commerce.order_confirmation",
  "recipient": { "userId": "uuid", "email": "masked@example.com" },
  "tenantId": "uuid",
  "locale": "fa-IR",
  "templateData": {
    "orderNumber": "ORD-1001"
  },
  "correlationId": "uuid",
  "idempotencyKey": "order-confirmation:order-id"
}
```

## Rules

- request فقط از Application/Worker داخلی می‌آید
- templateData schema دارد
- idempotency اجباری است
- Notification synchronous response به provider ندارد
- نتیجه delivery از طریق جدول و event قابل مشاهده است
