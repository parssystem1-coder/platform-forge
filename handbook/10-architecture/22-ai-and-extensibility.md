# ۲۲. AI و توسعه‌پذیری

> این فایل قرارداد را امروز می‌بندد تا فردا بتوانیم بسازیم. کدش در فاز ۸ به بعد نوشته می‌شود.

## ۲۲.۱ AI Gateway

هیچ ماژولی مستقیماً پروایدر را صدا نمی‌زند.

```text
غلط:   SEO -> OpenAI
درست:  SEO -> AI Gateway -> Model Router -> Provider
```

Gateway مالک این موارد است:

| مسئولیت | چرا مرکزی |
|----------|-------------|
| انتخاب مدل | هر ماژول نباید تصمیم مدل بگیرد |
| تلاش مجدد و fallback | منطق تکراری در ۶ جا فاجعه است |
| محاسبه هزینه و کردیت | باید در یک جا محاسبه شود |
| محدودیت نرخ | جلوگیری از مصرف بی‌رویه یک Tenant |
| نسخه prompt | قابلیت بازتولید و مقایسه |
| لاگ و ردگیری | عیب‌یابی پاسخ بد |

### قرارداد حداقلی

```ts
interface AiGateway {
  complete(req: {
    tenantId: string;
    taskKind: 'classify' | 'summarize' | 'generate' | 'embed' | 'reason';
    prompt: PromptRef;      // شناسه و نسخه، نه متن خام پراکنده
    input: unknown;
    maxCostCredits: number;  // سقف قطعی
    idempotencyKey: string;
  }): Promise<AiResult>;
}
```

نکته مهم: مصرف کردیت با الگوی رزرو اتمیک انجام می‌شود:

```text
reserve(estimated) -> اجرا -> commit(actual) یا release()
```

چون هزینه‌ی واقعی فقط بعد از پاسخ مشخص می‌شود.

---

## ۲۲.۲ مسیر امن ایجنت

AI هرگز مستقیم به دیتابیس نمی‌رسد. مسیر دقیقاً همان مسیر کاربر انسانی است:

```text
AI Agent
  -> MCP tool
  -> احراز هویت (machine client)
  -> tenant context
  -> authorize()          <- همان تابع، بدون استثنا
  -> Application Use Case
  -> Domain
```

اگر روزی کسی پیشنهاد داد ایجنت برای سرعت query مستقیم بزند، جواب خیر است. این مذاکره‌پذیر نیست.

---

## ۲۲.۳ رجیستری ابزار MCP

هر ابزار متادیتای اجباری دارد:

```text
name            commerce.search_products
version         1
permission      commerce.product.read
feature         commerce.catalog
quota           api.requests_per_month
creditCost      0
rateLimit       60/min
sideEffects     none | write | external
auditPolicy     always | on_write
```

قاعده: هر ابزار با `sideEffects=write` باید تأیید صریح داشته باشد یا در حالت dry-run قابل اجرا باشد.

---

## ۲۲.۴ اتوماسیون

تصمیم بازنگری‌شده: هسته به n8n وابسته نیست.

```text
Domain Event
  -> Automation Gateway (داخلی)
       |
       +-- مسیر ۱: Job داخلی در صف (پیش‌فرض)
       +-- مسیر ۲: n8n adapter (فاز بعدی، اختیاری)
```

### اگر روزی n8n آمد، این چهار مورد اجباری است

1. credential هر Tenant رمزنگاری‌شده و جدا
2. هر اجرا دارای `tenantId` و `correlationId`
3. سقف تعداد اجرا از طریق Quota
4. هرگز منطق کسب‌وکار در جریان کار، فقط فراخوانی API

> اگر منطق کسب‌وکار در n8n باشد، دیگر نمی‌توانی تست بنویسی، ریویو کنی، یا رول‌بک کنی.

---

## ۲۲.۵ افزونه

قرارداد امروز بسته می‌شود، پیاده‌سازی فاز ۱۲:

```text
Plugin
  -> Plugin SDK
  -> Platform API (همان API عمومی)
  -> Application Service
  -> Domain
```

هرگز: `Plugin -> Database`.

### manifest

```text
name, version, compatibility (semver پلتفرم)
permissions   درخواستی، نیاز به تأیید Owner
events        مورد علاقه
features      مورد نیاز
configSchema  اعتبارسنجی می‌شود
```

قاعده امنیتی: افزونه هرگز دسترسی بیشتر از کاربری که نصبش کرده ندارد.

---

## ۲۲.۶ معیار پذیرش (فازهای مربوطه)

- جستجوی کل کد برای نام provider های AI فقط در ماژول gateway نتیجه می‌دهد
- تست: قطعی provider اول به fallback منجر می‌شود
- تست: عبور از سقف کردیت قبل از فراخوانی پروایدر رد می‌شود
- تست: ابزار MCP بدون Permission متناظر قابل رجیستر نیست
