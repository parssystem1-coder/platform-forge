# معماری Billing و Ledger

## Provider Port

```ts
interface PaymentProvider {
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  capture(input: CaptureInput): Promise<CaptureResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  verifyWebhook(input: RawWebhook): Promise<VerifiedWebhook>;
  getPayment(reference: string): Promise<ProviderPaymentStatus>;
}
```

ماژول Billing فقط این port را می‌شناسد، نه نام Provider.

## Webhook مسیر امن

```text
HTTP webhook
 -> size/rate limit
 -> store raw immutable event
 -> verify signature
 -> dedupe provider event id
 -> enqueue processing
 -> process state transition
 -> post Ledger
 -> invalidate Feature cache
 -> Audit
```

HTTP handler نباید تمام business logic را synchronously انجام دهد.

## Ledger invariants

- amount > 0
- currency یکسان در Entry
- مجموع debit = مجموع credit
- Entry immutable
- reversal به entry اصلی اشاره می‌کند
- source idempotency key یکتا است

## Reconciliation

```text
scheduled job
 -> fetch provider status for recent window
 -> compare internal payments
 -> classify matched/unmatched/mismatch
 -> repair only through official use case
 -> alert unresolved mismatch
```

هرگز reconciliation با SQL دستی status را عوض نمی‌کند.
