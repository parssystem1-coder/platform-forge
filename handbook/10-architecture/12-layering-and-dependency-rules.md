# ۱۲. لایه‌بندی و قوانین وابستگی

> این فایل مهم‌ترین فایل معماری است. نقض هر کدام از این قوانین در CI رد می‌شود.

## ۱۲.۱ چهار لایه

```text
interfaces/      مترجم دنیای بیرون (REST, MCP, Webhook, CLI, Worker handler)
     |
     v
application/     هماهنگ‌کننده Use Case، مرز تراکنش، فراخوانی authorize
     |
     v
domain/          قوانین کسب‌وکار، موجودیت، مقدار، سیاست، خطای دامنه
     ^
     |
infrastructure/  پیاده‌سازی پورت‌ها: Postgres, Redis, Email, TOTP, Storage, HTTP client
```

### جهت وابستگی

```text
interfaces      -> application       مجاز
interfaces      -> domain (فقط type) مجاز ولی توصیه نمی‌شود
application     -> domain            مجاز
infrastructure  -> domain ports      مجاز
infrastructure  -> application ports مجاز

domain          -> هر چیز دیگر      ممنوع
application     -> interfaces        ممنوع
application     -> infrastructure    ممنوع (فقط پورت)
module A        -> داخل module B    ممنوع
```

---

## ۱۲.۲ لایه domain

### اجازه دارد

- موجودیت و مقدار (Entity, Value Object)
- قاعده و سیاست خالص
- خطای دامنه
- رخداد دامنه (فقط تولید، نه انتشار)

### ممنوع است

- import از NestJS، ORM، HTTP، Redis، لاگر
- خواندن `process.env`
- خواندن `Date.now()` مستقیم (از `Clock` بگیر)
- تولید UUID مستقیم (از `IdGenerator` بگیر)
- دانستن کد وضعیت HTTP

### مثال درست

```ts
// domain/entities/session.ts
export class Session {
  private constructor(
    readonly id: SessionId,
    readonly userId: UserId,
    private status: SessionStatus,
  ) {}

  canRefresh(now: Date, expiresAt: Date): boolean {
    return this.status === 'active' && now < expiresAt;
  }

  markCompromised(): void {
    if (this.status === 'revoked') throw new SessionAlreadyRevoked();
    this.status = 'compromised';
  }
}
```

این کلاس را می‌توان بدون دیتابیس و بدون فریم‌ورک تست کرد. اگر نمی‌شود، در جای اشتباهی قرار دارد.

---

## ۱۲.۳ لایه application

هر Use Case دقیقاً این مسئولیت‌ها را دارد:

1. فراخوانی `authorize()`
2. باز کردن مرز تراکنش
3. بارگزاری موجودیت‌ها
4. اجرای قاعده دامنه
5. ذخیره
6. ثبت Outbox و Audit
7. بازگرداندن نتیجه‌ی صریح

### امضای استاندارد

```ts
export class CreateProduct {
  constructor(
    private readonly authz: AuthorizationService,
    private readonly uow: UnitOfWork,
    private readonly products: ProductRepository,
    private readonly quota: QuotaService,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateProductInput, ctx: ActorContext): Promise<ProductId> {
    await this.authz.authorize(ctx, 'commerce.product.create', { tenantId: ctx.tenantId });

    return this.uow.withTenant(ctx.tenantId, async (tx) => {
      const reservation = await this.quota.reserve(tx, ctx.tenantId, 'commerce.products', 1);
      const product = Product.create(input, this.clock.now());
      await this.products.save(tx, product);
      await this.quota.commit(tx, reservation);
      await tx.outbox.append(ProductCreated.from(product, ctx));
      await tx.audit.append({ action: 'commerce.product.created', targetId: product.id, ctx });
      return product.id;
    });
  }
}
```

این الگو در کل پروژه تکرار می‌شود. تکرار اینجا فضیلت است، نه بدهی فنی.

---

## ۱۲.۴ لایه interfaces

Controller حداکثر چند خط است:

```ts
@Post()
async create(@Body() dto: CreateProductDto, @Actor() ctx: ActorContext) {
  const id = await this.createProduct.execute(dto.toInput(), ctx);
  return { id };
}
```

### ممنوعیت‌های Controller

- باز کردن تراکنش
- زدن query
- تفسیر نقش یا دسترسی
- محاسبه قیمت، موجودی، یا هر قاعده کسب‌وکار

---

## ۱۲.۵ لایه infrastructure

هر وابستگی خارجی از پشت یک پورت می‌آید:

| پورت | پیاده‌سازی فاز ۱ |
| ------ | ------------------- |
| `PasswordHasher` | Argon2id |
| `TokenSigner` | jose (EdDSA یا RS256) |
| `EmailSender` | SMTP و در local، Mailpit |
| `TotpProvider` | otplib |
| `Clock` | ساعت سیستم |
| `IdGenerator` | UUIDv7 |
| `ObjectStorage` | S3-compatible |
| `SecretBox` | AES-256-GCM با کلید نسخه‌دار |

دلیل: تعویض پروایدر نباید به تغییر در domain یا application منجر شود.

---

## ۱۲.۶ قرارداد عمومی ماژول

هر ماژول دقیقاً یک فایل ورودی دارد: `index.ts`. فقط این موارد صادر می‌شوند:

```ts
export { CommerceModule } from './commerce.module';
export type { CreateProductInput, ProductView } from './application/dto';
export { COMMERCE_EVENTS } from './application/events';
export { COMMERCE_PERMISSIONS } from './application/permissions';
```

هر چیزی که صادر نشود، خصوصی است. ماژول دیگر نمی‌تواند مسیر داخلی را import کند.

### ارتباط بین ماژول‌ها

دو راه مجاز وجود دارد:

1. **فراخوانی مستقیم Use Case عمومی** برای نیاز هم‌زمان
2. **مصرف رخداد** برای نیاز غیرهم‌زمان

ترجیح بر حالت دوم است. هر فراخوانی مستقیم بین‌ماژولی باید در PR توجیه شود.

---

## ۱۲.۷ اجبار در CI

فایل `.dependency-cruiser.cjs` در `90-skeleton/` قوانین زیر را اجبار می‌کند:

| قانون | شدت |
| ------- | ------ |
| domain → infrastructure | error |
| domain → interfaces | error |
| domain → پکیج خارجی ممنوعه | error |
| application → interfaces | error |
| ورود به مسیر داخلی ماژول دیگر | error |
| وابستگی حلقوی | error |
| ماژول بدون index.ts | warn |

> معماری بدون ابزار اجبار، فقط یک سند زیبا است که در ماه سوم نقض می‌شود.
