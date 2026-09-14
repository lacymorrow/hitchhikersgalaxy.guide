# Plan 007: Payment service — fix the documented N+1 in `getUsersWithPayments` and `getPaymentsWithUsers`

> **Executor instructions**: Follow this plan step by step. **Do not start
> this plan until plan 008 (payment-service tests) is DONE** — the N+1 fix
> changes the shape of multi-provider calls; without a safety net, regression
> risk is high. If 008 is not yet done, stop and report.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- src/server/services/payment-service.ts src/server/providers`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/008-payment-service-tests.md (must be DONE).
- **Category**: performance
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/228

## Why this matters

`audit-progress.md` (Nov 2025) documented two N+1 / O(N×M) issues in
`payment-service.ts` and they remain in code at commit `6358b2b2`:

1. **`getUsersWithPayments` (lines ~832–979)** — fetches all users + all
   payments, then for every user calls `provider.getPaymentStatus()` and
   `provider.hasUserActiveSubscription()` on every enabled provider.
   100 users × 3 providers × 2 calls = 600 external API calls per admin
   list load.
2. **`getPaymentsWithUsers` (lines ~613–809)** — for every payment, runs
   `allUsers.find(…)` against the in-memory list, producing
   O(N×M) iterations.

Both are admin-facing operations. They're slow today and will time out at
moderate scale (the first one already does on accounts with many enabled
providers + a few hundred users).

## Current state

Open `src/server/services/payment-service.ts` and read both methods cold.
Approximate landmarks at commit `6358b2b2`:

- `getUsersWithPayments()` — search for the function name. Inside it, you'll
  find: `for (const user of users) { for (const provider of providers) { … await provider.getPaymentStatus(…) … } }` — that's the per-user-per-provider call.
- `getPaymentsWithUsers()` — search the function name. Inside it, look for
  `allUsers.find(`. The find-in-loop is on every payment.

The plan does NOT prescribe exact line numbers — read the live code first.

## Commands you will need

| Purpose            | Command                                                             | Expected                     |
| ------------------ | ------------------------------------------------------------------- | ---------------------------- |
| Install            | `bun install`                                                       | exit 0                       |
| Typecheck          | `bun run typecheck`                                                 | no new errors                |
| Tests              | `bun run test -- tests/unit/server/services/payment`                | all pass (incl. 008's suite) |
| Benchmark (manual) | see Step 5 — populate a dev DB and time both functions before/after | < 1/10 the call count        |

## Scope

**In scope:**

- `src/server/services/payment-service.ts` only — the two methods above.

**Out of scope:**

- Splitting `payment-service.ts` (it's >1k lines; `audit-progress.md`
  proposed a multi-file split). Do that in a follow-up. This plan keeps the
  file's structure.
- Caching layer for provider API calls beyond a single request. (You can
  add it later; this plan dedupes within one call.)
- Changes to provider implementations (`src/server/providers/`).
- The webhook handlers (separate plan 004 territory).

## Git workflow

- Branch: `advisor/007-payment-service-n+1`
- Two commits if helpful:
  - `perf(payment-service): replace allUsers.find() loop with Map lookup`
  - `perf(payment-service): batch provider subscription checks per user`
- Or one bundled commit if the diffs are small.

## Steps

### Step 1: Fix `getPaymentsWithUsers` (O(N×M) → O(N+M))

Before:

```ts
const allUsers = await this.userService.getAllUsers();    // M users
for (const payment of payments) {                          // N payments
  const user = allUsers.find((u) => u.id === payment.userId);  // O(M) per iteration
  …
}
```

After:

```ts
const allUsers = await this.userService.getAllUsers();
const usersById = new Map(allUsers.map((u) => [u.id, u]));
for (const payment of payments) {
  const user = usersById.get(payment.userId);
  …
}
```

This is a behavior-preserving refactor — same output, lower complexity. No
test changes required if plan 008's tests cover the function.

**Verify**: `bun run test -- tests/unit/server/services/payment` — still passes.

### Step 2: Fix `getUsersWithPayments` (per-user-per-provider → batched)

This is the harder one. Read the current logic carefully — there are a few
escape hatches (free products, isInDatabase flag) that must be preserved.

Strategy:

1. Fetch the full payments table once at the start (one query).
2. Group payments by `userId` into a `Map<userId, Payment[]>`.
3. For each user, determine subscription status from the _local_ payment
   records first. Only fall through to `provider.getPaymentStatus(userId)`
   if the local data is inconclusive (e.g., no record yet, or status is
   ambiguous and a provider call is genuinely necessary).
4. When you DO need to call providers, do it once per (user, provider) and
   cache within the function — same user is not asked twice.

Concrete shape (pseudocode; adapt to the actual locals in the function):

```ts
const allPayments = await db?.query.payments.findMany({}); // single read
const paymentsByUser = new Map<string, Payment[]>();
for (const p of allPayments ?? []) {
  const list = paymentsByUser.get(p.userId) ?? [];
  list.push(p);
  paymentsByUser.set(p.userId, list);
}

const result: UsersWithPaymentsRow[] = [];

for (const user of users) {
  const localPayments = paymentsByUser.get(user.id) ?? [];

  // If we already have a recent active record locally, we're done.
  const localActive = localPayments.find((p) => p.status === "active" || p.status === "completed");
  if (localActive) {
    result.push({ user, payment: localActive, isFromProvider: false, isInDatabase: true });
    continue;
  }

  // Otherwise consult providers in parallel (per user, not per provider sequentially).
  const providerResults = await Promise.all(
    providers.map(async (provider) => {
      try {
        const status = await provider.getPaymentStatus(user.id);
        return status ? { provider, status } : null;
      } catch (e) {
        logger.warn("provider.getPaymentStatus failed", {
          provider: provider.id,
          userId: user.id,
          error: e,
        });
        return null;
      }
    })
  );

  const found = providerResults.find((r) => r?.status);
  if (found) {
    result.push({ user, status: found.status, isFromProvider: true, isInDatabase: false });
  } else {
    result.push({ user, status: null, isInDatabase: false });
  }
}
```

Two effects: (a) when local payments cover the question, zero provider
calls; (b) when provider calls are necessary, the `Promise.all` runs
providers in parallel for _that user_, not sequentially.

Keep the existing return-shape, the existing `isInDatabase`/`isFreeProduct`
flags, and the existing error handling. Do not change the function's
signature.

**Verify**: `bun run test -- tests/unit/server/services/payment` — all of plan 008's tests still pass. If any fail, the rewrite changed behavior; revert and iterate.

### Step 3: Add a "provider call count" diagnostic (optional but recommended)

Wrap each `provider.getPaymentStatus` call in a counter:

```ts
let providerCallCount = 0;
…
providerCallCount++;
await provider.getPaymentStatus(userId);
…
logger.info("getUsersWithPayments completed", { userCount: users.length, providerCallCount });
```

Useful for verifying the reduction in production logs after rollout. Can be removed once the win is confirmed.

### Step 4: Update tests if plan 008 has placeholders

Plan 008 stands up the test scaffolding. If 008 left TODO tests for the
N+1 functions specifically (it should — those are the most important
behaviors to lock in), this plan fills them in. Tests to add or extend:

1. **`getPaymentsWithUsers` with 1000 payments, 1000 users — terminates in O(N+M) time.** (Don't measure wall clock; assert the test runs in under, say, 1 second on the test runner.)
2. **`getUsersWithPayments` with 0 enabled providers** — no provider calls; users with local payments still appear.
3. **`getUsersWithPayments` with 1 enabled provider** — provider called at most once per user without a local payment record.
4. **`getUsersWithPayments` doesn't call providers for users with a local active payment** — assert call count = 0 for those users.

**Verify**: `bun run test -- tests/unit/server/services/payment` — all pass.

### Step 5: Manual benchmark

In a dev environment with `LEMONSQUEEZY_API_KEY` (or stubbed providers):

1. Seed ~100 users with `bun run db:seed` (or manually).
2. Run an admin route that triggers `getUsersWithPayments` (find it: it's likely the admin payments page).
3. Note the response time and the number of provider call logs.
4. Land the change.
5. Repeat. Provider call count should drop dramatically (≥ 10× reduction).

Record before/after numbers in the PR description.

## Test plan

- Tests authored / extended in `tests/unit/server/services/` (plan 008's payment service file is the home; if plan 008 used `tests/unit/server/services/payment-service.test.ts`, write there).
- 4 tests as enumerated in Step 4.
- Verification: `bun run test -- tests/unit/server/services/payment-service.test.ts` passes; manual benchmark shows 10× reduction.

## Done criteria

- [ ] Plan 008 is DONE (verify by checking `plans/README.md`).
- [ ] `bun run typecheck` exits 0 (no new errors).
- [ ] `bun run test -- tests/unit/server/services/payment-service.test.ts` exits 0 with new tests.
- [ ] `grep -n "allUsers.find" src/server/services/payment-service.ts` returns nothing.
- [ ] `grep -n "for (const user" src/server/services/payment-service.ts` no longer has a nested per-provider call sequence inside it (eyeball — the inner provider loop should now be a `Promise.all`).
- [ ] Step 5 manual benchmark recorded.
- [ ] `plans/README.md` status row for 007 updated.

## STOP conditions

- Plan 008 is not DONE. (You'll regret skipping it; there are too many subtle code paths in these functions to refactor without coverage.)
- The current `getPaymentsWithUsers` returns a shape that mixes local-only and provider-only rows in a way that can't be flattened to one local-first pass. Read it cold; if so, the strategy in Step 2 needs adjustment — report.
- The provider `getPaymentStatus` interface has side effects (writes to a DB, mutates internal cache state) that depend on being called per user. Read each provider implementation in `src/server/providers/`. If yes, plan a different decoupling.

## Maintenance notes

- The longer-term split of `payment-service.ts` (described in
  `audit-progress.md` Phase 1.2) is still wanted; this plan deliberately
  doesn't tackle it. After this lands, the function is smaller and the
  split is easier.
- A provider-result cache with a short TTL (e.g. 60 seconds) would be the
  next win — across multiple admin page loads in the same minute, zero
  external API calls. Not included here.
- Reviewer should scrutinize: the return-shape parity between old and new
  implementations (run both side-by-side on seed data once); the
  `Promise.all` doesn't swallow errors silently (the per-provider catch
  logs).

## Backfill candidate for `shipkit-io/bones`

Yes — payments code is shared. Backfill after merge.
