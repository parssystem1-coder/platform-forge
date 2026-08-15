# ADR-0016: مسیر دسترسی برای هر چهار realm

## وضعیت
pending review — برخاسته از F-015، F-029، F-030

## زمینه
ADR-0004 یک تابع واحد `authorize` را الزام کرد. اما پیاده‌سازی نمونه فقط برای `user` کار می‌کرد. `machine` به دلیل فقدان return رد می‌شد، `customer` مستقیماً Forbidden می‌گرفت و `staff` هیچ مسیری نداشت.

پیامد عملی: هر تیمی که این را پیاده کند، برای Storefront یک مسیر موازی می‌سازد. یعنی قانون طلایی ۱ در پرترافیک‌ترین مسیر سیستم می‌شکند.

## تصمیم
دو تابع در همان ماژول، نه دو ماژول:

```text
authorize(actor, permission, resource)      user | staff | machine
authorizeCustomer(actor, action, resource)  customer
```

قواعد:
- `staff` از permission سراسری عبور می‌کند و هر دسترسیش در همان تابع audit می‌شود.
- `machine` از scope عبور می‌کند و بلافاصله return می‌کند.
- `customer` مبتنی بر ownership است، نه permission. Guest با توکن امضاشده بالادست به customerId ترجمه می‌شود.

## پیامد منفی
- دو نقطه ورود به جای یکی. پذیرفتنی است، چون دو مدل ذاتاً متفاوتند: permission-based در مقابل ownership-based. جمع کردنشان در یک تابع، در عمل یک تابع با دو شاخه غیرمرتبط می‌سازد.
- دسترسی staff الان یک نوشتن audit اضافه می‌کند. عمدی است.

## شرط بازبینی
اگر realm پنجمی لازم شد (مانند partner یا reseller)، این الگو باید به یک policy engine تبدیل شود، نه تابع سوم.
