# برنامه اجرای فاز ۲

## Slice 1: Catalog

- [ ] Product domain
- [ ] Variant domain
- [ ] Product repositories
- [ ] Product migrations
- [ ] Product permissions
- [ ] Admin endpoints
- [ ] Catalog tests

## Slice 2: Read Model

- [ ] ProductCreated/ProductUpdated events
- [ ] storefront_products projection
- [ ] projector idempotency
- [ ] slug lookup endpoint
- [ ] cache tags
- [ ] projection lag metric

## Slice 3: Customer and Cart

- [ ] customer domain
- [ ] guest customer creation
- [ ] customer session boundary
- [ ] cart aggregate
- [ ] cart endpoints
- [ ] cart tests

## Slice 4: Inventory and Checkout

- [ ] inventory reservation SQL
- [ ] reservation expiry job
- [ ] checkout price re-read
- [ ] order aggregate
- [ ] order line snapshots
- [ ] payment port
- [ ] fake payment adapter
- [ ] checkout idempotency

## Slice 5: Storefront

- [ ] domain mapping
- [ ] product page
- [ ] category/list baseline
- [ ] cache headers
- [ ] responsive RTL UI
- [ ] storefront performance test

## Slice 6: Reliability and Gate

- [ ] payment failure release
- [ ] order cancellation
- [ ] outbox consumers
- [ ] notification event
- [ ] audit coverage
- [ ] tenant leak suite
- [ ] concurrency inventory test
- [ ] full phase gate
