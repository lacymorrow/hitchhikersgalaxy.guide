# Plan 008: Characterization tests for `payment-service.ts`

> **Executor instructions**: Follow this plan step by step. If anything in
> the "STOP conditions" section occurs, stop and report. When done, update
> the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- src/server/services/payment-service.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (test-only, but mocks of payment providers are easy to write wrong)
- **Depends on**: none.
- **Category**: tests (characterization — lock in current behavior before a refactor)
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/229

## Why this matters

`payment-service.ts` is 1067 lines, orchestrates three providers (Lemon
Squeezy, Stripe, Polar), and is the only thing standing between webhooks
and the user-facing access-control story. It has zero unit tests. Every
other planned change that touches it (plans 004, 007) is risky without a
safety net.

This plan is _characterization_ — capture what the code does today, so
refactors land safely. It is not a quality assessment.

## Current state

Tests inventory (recon):

- Existing service tests live in `tests/unit/server/services/` — `waitlist-service.test.ts`, `feedback-service.test.ts`, `deployment-service.test.ts`, `github/github-service.test.ts`, `team/team-service.test.ts`.
- No file matches `tests/**/*payment*`.
- `tests/e2e/admin-payment-import.spec.ts` exists but is an end-to-end Playwright test of the admin import UI, not the service.
- Test runner: Vitest (`bun run test`); see `vitest.config.ts` for setup.

The service exposes these public methods (verify by reading the file's
`export` lines and the `class PaymentService` block):

- `createPayment`
- `getPaymentByOrderId`
- `getUserPaymentStatus`
- `hasUserPurchasedProduct`
- `hasUserPurchasedVariant`
- `getUsersWithPayments` (N+1 target)
- `getPaymentsWithUsers` (O(N×M) target)
- … and others — read the file.

## Commands you will need

| Purpose         | Command                                                              | Expected               |
| --------------- | -------------------------------------------------------------------- | ---------------------- |
| Install         | `bun install`                                                        | exit 0                 |
| Tests (focused) | `bun run test -- tests/unit/server/services/payment-service.test.ts` | new tests pass         |
| Tests (full)    | `bun run test`                                                       | nothing else regresses |

## Scope

**In scope:**

- New file: `tests/unit/server/services/payment-service.test.ts`.
- Mocks under `tests/unit/server/services/__mocks__/` or inline — match the
  pattern used in existing service tests (look at
  `team/team-service.test.ts` first).
- A small fixture file if the existing service test pattern uses one.

**Out of scope:**

- Refactoring `payment-service.ts` (that's plan 007).
- Splitting `payment-service.ts` into smaller modules (separate follow-up).
- Integration tests against real provider sandboxes (worth doing later;
  not in this plan).
- Testing every public method exhaustively. Aim for 70% of behaviors
  weighted by how risky they are; stop when adding the next test feels
  like over-fitting.

## Git workflow

- Branch: `advisor/008-payment-service-tests`
- One commit: `test(payment-service): characterization suite covering create, lookup, status, and multi-provider purchase checks`

## Steps

### Step 1: Read the exemplar tests

Read `tests/unit/server/services/team/team-service.test.ts` _and_
`tests/unit/server/services/deployment-service.test.ts` cold. Note:

- How `db` is mocked (`vi.mock("@/server/db", …)` or fixture pattern).
- How services that depend on `db` are imported and reset between tests.
- How errors from `db?.query…` are simulated.

Match that style. Don't invent a new one.

### Step 2: Scaffold the file

Create `tests/unit/server/services/payment-service.test.ts`. Boilerplate:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({
  db: {
    query: {
      payments: { findFirst: vi.fn(), findMany: vi.fn() },
      users: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
    // adjust to match exemplar exactly
  },
}));

vi.mock("@/server/providers", () => ({
  getEnabledProviders: vi.fn(() => []),
}));

import { PaymentService } from "@/server/services/payment-service";

describe("PaymentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests go here
});
```

Adjust to whatever the exemplar style is.

### Step 3: Author tests for high-risk methods

Six characterization tests, in priority order:

1. **`hasUserPurchasedProduct` returns true when local payment exists.**
   Mock `db.query.payments.findFirst` to return a row matching userId +
   productName + status="completed". Expect `true`. No provider calls.

2. **`hasUserPurchasedProduct` falls through to providers when no local
   record exists.** Mock no local record; mock one enabled provider whose
   `hasUserPurchasedProduct` returns `true`. Expect `true` from the
   service. (Also: when the provider returns `false`, the service returns
   `false`.)

3. **`hasUserPurchasedVariant` uses variant-aware provider method when
   available, falls back to product check when not.** Two test cases:
   - Provider has `hasUserPurchasedVariant`: it's called; product method
     not called.
   - Provider lacks `hasUserPurchasedVariant`: `hasUserPurchasedProduct`
     called instead.

4. **`getPaymentByOrderId` returns null when not found.** Just verifies
   the query call shape.

5. **`getUsersWithPayments` baseline behavior** (this is the function plan
   007 will refactor — locking in the shape now is the whole point):
   - 0 users: returns `[]`.
   - 1 user with 1 local payment: returns one entry where the payment
     comes from the DB (not from a provider). Provider stubs not called
     for that user.
   - 1 user with no local payment, 1 provider that returns active status:
     returns one entry sourced from the provider.

6. **`getPaymentsWithUsers` baseline behavior** (plan 007 target):
   - 0 payments: returns `[]`.
   - 5 payments mapped to 3 users: returned rows have correct user data
     joined for each payment.

Where the method is too complex to mock at the boundary (e.g. internal
calls to other services), use `vi.spyOn` to stub the dependent method
rather than mocking that service whole — the goal is to test
payment-service's behavior, not to reimplement its world.

### Step 4: Snapshot of return shapes (optional safety net)

For `getUsersWithPayments` and `getPaymentsWithUsers`, write a `it.todo` or
a snapshot of the _current_ return shape (one realistic example). When plan
007 refactors, the snapshot tells you immediately if the shape changed
silently. Vitest snapshots: `expect(result).toMatchInlineSnapshot()`.

Decision: snapshots are fine here because the function output is
deterministic given fixed inputs. Use them sparingly.

### Step 5: Run the suite

`bun run test -- tests/unit/server/services/payment-service.test.ts`

If tests fail because the mocked `db` shape doesn't match the real one,
fix the mock. If they fail because the service throws unexpectedly, that's
a bug to characterize — write the test to expect the throw (or fix the bug
if it's obvious; otherwise file a follow-up).

### Step 6: Full suite

`bun run test`

Should still pass. If a new test inadvertently leaks state (Vitest module
caching can do this with `vi.mock` at the top), use `vi.resetModules()` in
`afterEach` or scope mocks to `vi.hoisted` patterns.

## Test plan

- New file: `tests/unit/server/services/payment-service.test.ts`.
- ~6 characterization tests as enumerated in Step 3, plus 1–2 snapshots
  in Step 4.
- Model after: `tests/unit/server/services/team/team-service.test.ts`.
- Verification: `bun run test -- <file>` exits 0 with the new tests.

## Done criteria

- [ ] `bun run test -- tests/unit/server/services/payment-service.test.ts` exits 0 with at least 6 new tests.
- [ ] `bun run test` exits 0 — no regressions in the existing suite.
- [ ] Snapshots (if used) reviewed and committed alongside.
- [ ] `plans/README.md` status row for 008 updated.

## STOP conditions

- The existing service-test exemplars use a mocking strategy you cannot get
  to work for `payment-service.ts` because of its imports (e.g. a giant
  side-effect at module load). Report — the right fix is to lazy-load
  inside the methods, not to fight the mock.
- Vitest configuration is in a broken state for service tests today (one
  of the existing tests is failing on `main`). Run `bun run test` BEFORE
  writing anything; if reds, fix them or report.

## Maintenance notes

- These are characterization tests, not specification. When the underlying
  behavior should change (e.g. plan 007's refactor), the test gets updated
  to match the _intentional_ new behavior — not "fixed" to make a green
  pass-through.
- The harder integration-style tests (real provider sandbox calls) belong
  in a separate `tests/integration/` suite, not here.
- Reviewer should scrutinize: tests aren't asserting on mocks' return
  values (`expect(mock).toHaveBeenCalled` style only), they're asserting on
  service output.

## Backfill candidate for `shipkit-io/bones`

Yes — same code in bones.
