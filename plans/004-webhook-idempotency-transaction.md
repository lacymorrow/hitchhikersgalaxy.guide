# Plan 004: Payment-webhook idempotency — unique constraint + transactional insert

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. If anything in the "STOP conditions" section occurs,
> stop and report. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- src/server/db/schema.ts src/app/\(app\)/webhooks/lemonsqueezy/route.ts src/app/\(app\)/webhooks/stripe/route.ts src/server/services/payment-service.ts`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (but coordinate with plan 006 if running in parallel — both touch the schema).
- **Category**: correctness (money)
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/225

## Why this matters

Both the LemonSqueezy and Stripe webhook handlers use a _check-then-insert_
pattern with no DB transaction and no DB-level uniqueness:

1. Read: does a payment with this `orderId` already exist?
2. If not, insert a new payment row.

Between (1) and (2), a second concurrent webhook delivery (provider retry,
proxy re-emit, queue redelivery) can pass the same check and insert a second
row. Result: the same order produces two `payments` rows → double credits,
double product access, double counts on revenue dashboards. Money bugs are
the most expensive class of bug; this is the kind a busy webhook eventually
hits in production.

The fix is layered: a DB-level unique constraint guarantees correctness even
under any race, and a transaction (with `ON CONFLICT DO NOTHING`) keeps the
handler's happy path clean.

## Current state

Schema:

```ts
// src/server/db/schema.ts:87-103
export const payments = createTable("payment", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  orderId: varchar("order_id", { length: 255 }),                   // ← not unique, nullable
  processorOrderId: varchar("processor_order_id", { length: 255 }),
  amount: integer("amount"),
  status: varchar("status", { length: 255 }).notNull(),
  processor: varchar("processor", { length: 50 }),
  …
});
```

Lemon Squeezy:

```ts
// src/app/(app)/webhooks/lemonsqueezy/route.ts:138-159
async function isEventProcessed(eventId, eventName): Promise<boolean> {
  try {
    const existingPayment = await db?.query.payments.findFirst({
      where: eq(payments.orderId, eventId),
    });
    if (!existingPayment && eventName.startsWith("subscription_")) {
      const existingSubscriptionPayment = await db?.query.payments.findFirst({
        where: (payments, { and, like }) =>
          like(payments.metadata, `%"subscription_id":"${eventId}"%`),
      });
      return !!existingSubscriptionPayment;
    }
    return !!existingPayment;
  } catch (error) {
    logger.error("Error checking if event is processed", { eventId, eventName, error });
    return false; // ← silent: returns "not processed" on DB error
  }
}
```

Stripe (`payment_intent.succeeded`):

```ts
// src/app/(app)/webhooks/stripe/route.ts:138-168
const existingPayment = await PaymentService.getPaymentByOrderId(paymentIntent.id);
if (!existingPayment) {
  await PaymentService.createPayment({
    userId: user.id,
    orderId: paymentIntent.id,
    status: "completed",
    …
  });
}
```

No transaction in either case. No `UNIQUE` on `payments(orderId, processor)`.

## Commands you will need

| Purpose       | Command                                                                                               | Expected                         |
| ------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------- |
| Install       | `bun install`                                                                                         | exit 0                           |
| Generate      | `bun run db:generate`                                                                                 | new migration file in `drizzle/` |
| Migrate (dev) | `bun run db:migrate`                                                                                  | exit 0                           |
| Typecheck     | `bun run typecheck`                                                                                   | no new errors                    |
| Tests         | `bun run test -- tests/unit/server/services/payment tests/unit/server/webhooks`                       | pass                             |
| Lint          | `bun run lint:biome -- src/server/db src/app/\(app\)/webhooks src/server/services/payment-service.ts` | exit 0                           |

## Scope

**In scope:**

- `src/server/db/schema.ts` — add a unique constraint on `(processor, processorOrderId)` (preferred — see Step 1 for why not `orderId`).
- `src/server/services/payment-service.ts` — the `createPayment` method's insert path.
- `src/app/(app)/webhooks/lemonsqueezy/route.ts` — switch from check-then-insert to "attempt insert; on conflict skip".
- `src/app/(app)/webhooks/stripe/route.ts` — same.
- A new migration file generated by Drizzle Kit.
- Tests for the conflict path.

**Out of scope:**

- Polar webhook: idempotency there depends on `origin/security` having
  landed the signature-verification fix. Plan a follow-up; do not bundle.
- Refactoring the LemonSqueezy `subscription_*` events' metadata-LIKE check
  (plan handles the `order_*` happy path; subscription events use a fallback
  that's also wobbly but is a separate refactor — see Maintenance notes).
- Changing `payments.id` from `serial` (don't).

## Git workflow

- Branch: `advisor/004-webhook-idempotency`
- One commit covering schema, migration, services, webhooks, and tests: `fix(payments): atomic webhook idempotency via unique (processor, processor_order_id) + on-conflict insert`

## Steps

### Step 1: Add a unique constraint to `payments`

The right key is `(processor, processorOrderId)`, not `orderId` alone:

- `orderId` is nullable (free-product internal IDs may be absent).
- Two providers could theoretically emit the same `orderId` string.
- `processorOrderId` is the foreign system's authoritative ID.

If `processorOrderId` is currently _also_ nullable, you can't enforce a
unique constraint until non-null is true for the rows webhooks insert. Two
acceptable shapes:

**Option A (cleaner, recommended):** make `processorOrderId notNull` on all
new inserts (the webhook handlers always have it). Existing nullable rows
created before this change are tolerated; the constraint is `UNIQUE (processor, processor_order_id)` _with_ `processorOrderId` still nullable in the schema (Postgres allows multiple NULLs in a unique index by default). This works.

**Option B:** introduce a separate dedup table `payment_idempotency (processor, event_id PRIMARY KEY)` and write to it inside the same transaction as the payment insert. More code, but doesn't change the existing schema. Pick A unless you discover a reason A breaks.

Drizzle syntax (in `src/server/db/schema.ts`, payments table, after the field block):

```ts
export const payments = createTable(
  "payment",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    orderId: varchar("order_id", { length: 255 }),
    processorOrderId: varchar("processor_order_id", { length: 255 }),
    …
  },
  (t) => ({
    processorOrderUnique: uniqueIndex("payment_processor_processor_order_id_uniq").on(
      t.processor,
      t.processorOrderId,
    ),
  }),
);
```

Import `uniqueIndex` from `drizzle-orm/pg-core` (it's the postgres adapter
this repo uses — check the existing `index`/`uniqueIndex` imports at the top
of `schema.ts`).

**Verify**:

- `bun run db:generate` produces a new migration that contains `CREATE UNIQUE INDEX`.
- Inspect the migration. Expect: `CREATE UNIQUE INDEX "payment_processor_processor_order_id_uniq" ON "payment" ("processor","processor_order_id")` (table name may be prefixed if `DB_PREFIX` is set — that's fine).

### Step 2: Run the migration locally

`bun run db:migrate`

**Verify**: command exits 0. Open Drizzle Studio (`bun run db:studio`) and confirm the unique index exists on the payments table.

If the migration fails because existing rows violate the constraint (two
payments with the same `(processor, processorOrderId)` already exist), STOP
and report the duplicate rows — that's pre-existing data corruption that
needs operator review before the fix lands.

### Step 3: Update `PaymentService.createPayment` to handle conflicts

Find the method (in `src/server/services/payment-service.ts` — search for
`createPayment`). Adapt the insert call:

```ts
const inserted = await db
  ?.insert(payments)
  .values({ … })
  .onConflictDoNothing({ target: [payments.processor, payments.processorOrderId] })
  .returning();

if (!inserted || inserted.length === 0) {
  // Conflict: another concurrent insert already wrote this payment. That's success — idempotent.
  return await PaymentService.getPaymentByProcessorOrderId(values.processor, values.processorOrderId);
}
return inserted[0];
```

Add a `getPaymentByProcessorOrderId(processor, processorOrderId)` query if
it doesn't already exist — it's a 5-line method.

The signature of `createPayment` should NOT change for callers — return the
existing-or-just-inserted payment record either way.

### Step 4: Simplify the webhook check-then-insert into a single call

LemonSqueezy `route.ts`:

- For `order_*` event types, the existing `isEventProcessed` call can stay
  as a fast-path optimization (it answers 200 quickly when an event is
  obviously already processed), but the _correctness_ now lives in
  `createPayment`'s `onConflictDoNothing`. Add a comment noting that the
  pre-check is now an optimization, not a guarantee.
- For `subscription_*` events: see Maintenance notes; do not change behavior
  here unless trivially adapting.

Stripe `route.ts`: the `if (!existingPayment) { createPayment(…) }` block
can be reduced to `await PaymentService.createPayment(…)` — `createPayment`
itself handles the conflict. Keep the `existingPayment` log block if
desired for debug visibility (read first, then call).

Critically: fix the silent-on-error path. Change:

```ts
} catch (error) {
  logger.error("Error checking if event is processed", { eventId, eventName, error });
  return false;
}
```

to:

```ts
} catch (error) {
  logger.error("Error checking if event is processed", { eventId, eventName, error });
  throw error;   // bubble — the outer handler returns 500 → provider will retry
}
```

A 500 tells LemonSqueezy/Stripe to retry; returning `false` silently lets a
broken DB connection turn into a missed payment.

### Step 5: Tests

Create `tests/unit/server/services/payment-service-idempotency.test.ts` (or
add to an existing payment-service test file once plan 008 introduces one;
this plan should NOT block on plan 008 — write the file fresh if needed).

Tests:

1. **Conflict returns existing.** Call `createPayment` once with `processor:"stripe", processorOrderId:"pi_123"`. Call again with the same key — second call returns the same record, no second row inserted. (Verify with a `db.select().from(payments).where(…).count()` style query.)
2. **Different `processorOrderId` inserts a new row.** Same processor, different IDs → two rows.
3. **Different `processor`, same `processorOrderId` inserts a new row.** (E.g. someone has both a Stripe and a LemonSqueezy order with the same external string ID — pathological but possible.)

Run with an in-memory or test postgres (whatever the deployment service test
already uses — look at `tests/unit/server/services/deployment-service.test.ts`
for the test DB pattern). If no test DB exists, mock at the Drizzle layer
and assert that `onConflictDoNothing` is in the insert builder chain.

**Verify**: `bun run test -- tests/unit/server/services/payment-service-idempotency.test.ts` — all pass.

### Step 6: Manual smoke test

Use Stripe CLI (`stripe trigger payment_intent.succeeded`) twice with the
same event ID, or curl-replay a captured LemonSqueezy webhook. Confirm a
single row appears in `payments`.

## Test plan

- New file: `tests/unit/server/services/payment-service-idempotency.test.ts`
- 3 tests as enumerated above.
- Model after the test DB pattern used in `tests/unit/server/services/deployment-service.test.ts`.
- Verification: `bun run test -- <that file>` passes; replay test (Step 6) yields exactly one payment row.

## Done criteria

- [ ] Drizzle migration exists in `drizzle/` and was applied locally.
- [ ] `bun run typecheck` exits 0 (no new errors versus baseline).
- [ ] `bun run test` exits 0 with new tests.
- [ ] `grep -n "onConflictDoNothing" src/server/services/payment-service.ts` shows the chain.
- [ ] `grep -n "return false" src/app/\(app\)/webhooks/lemonsqueezy/route.ts | head` shows the silent-fallback removed (the `isEventProcessed` catch now throws).
- [ ] Manual replay test in Step 6 produces exactly one row.
- [ ] `plans/README.md` status row for 004 updated.

## STOP conditions

- Step 2 migration fails because of existing duplicate rows — that's data
  to resolve before this lands.
- `payments.processorOrderId` is currently being populated as NULL by some
  webhook path you discover — fix that BEFORE adding the unique index, or
  the migration will silently allow continued duplicates (Postgres unique
  index permits multiple NULLs).
- You discover that `PaymentService.createPayment` has multiple callers
  outside the webhook handlers (e.g. admin tools doing batch insert) that
  rely on the old "always insert" behavior. STOP and report — the conflict
  semantics need to be acceptable to all callers.

## Maintenance notes

- The LemonSqueezy `subscription_*` event idempotency uses a metadata LIKE
  query (`%"subscription_id":"${eventId}"%`). After this plan, the _payment_
  insert is safe, but the _subscription metadata search_ is still messy.
  Follow-up plan to extract subscription IDs into a real column and index
  it — out of scope here.
- The Polar webhook gets the same treatment once its signature verification
  has landed (it's fixed on `origin/security`). Repeat this pattern there
  in a follow-up plan.
- Reviewer should scrutinize: the conflict target columns match the unique
  index name; the catch-and-rethrow doesn't accidentally suppress useful
  error context; webhook 500s really do trigger provider retries (check
  each provider's retry policy).

## Backfill candidate for `shipkit-io/bones`

Yes — payments code is shared. Backfill after merge.
