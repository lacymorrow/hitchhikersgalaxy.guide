# Plan 002: LemonSqueezy webhook — reject untrusted `custom_data.user_id`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. If anything in the "STOP conditions" section occurs,
> stop and report. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- src/app/\(app\)/webhooks/lemonsqueezy/route.ts`
> If the file changed since this plan was written, compare the "Current state"
> excerpt against the live code before proceeding.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none. (`origin/security` did not touch this file.)
- **Category**: security (IDOR / payment misattribution)
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/223

## Why this matters

The LemonSqueezy webhook handler resolves the buyer by trusting
`custom_data.user_id` from the webhook payload before falling back to email.
Even though the webhook body is HMAC-signed by LemonSqueezy (so the data is
not attacker-injected at the wire level), the value of `custom_data` is
populated from the **checkout page's query string**, which is fully
attacker-controlled. An attacker can construct a checkout URL with
`checkout[custom][user_id]=<victim-id>`, pay for the product themselves, and
the webhook will credit the access to the victim's account instead of theirs
— or, more usefully to the attacker, claim a victim's perks while leaving the
attacker's email as the billing contact.

LemonSqueezy's documented use of `custom_data` is for _hints_, not
authentication; the only trustworthy identity in the webhook is the verified
buyer email.

## Current state

```ts
// src/app/(app)/webhooks/lemonsqueezy/route.ts:167-200
async function findOrCreateUser(
  userEmail: string,
  userName?: string | null,
  customData?: any
): Promise<string> {
  try {
    // First try to find user by custom data user_id
    if (customData?.user_id) {
      const existingUser = await db?.query.users.findFirst({
        where: eq(users.id, customData.user_id),
      });
      if (existingUser) {
        return existingUser.id;           // ← ATTACKER WIN: returns victim's id
      }
    }

    // Use the consistent userService method for finding or creating users
    const { user, created } = await userService.findOrCreateUserByEmail(userEmail, {
      name: userName || null,
    });
    …
    return user.id;
  } catch (error) { … }
}
```

The function is called from event handlers higher in the file (`handleOrderCreated`, etc.) which pass `payload.meta?.custom_data` straight through.

## Commands you will need

| Purpose   | Command                                                                  | Expected      |
| --------- | ------------------------------------------------------------------------ | ------------- |
| Install   | `bun install`                                                            | exit 0        |
| Typecheck | `bun run typecheck`                                                      | no new errors |
| Tests     | `bun run test -- tests/unit/server/webhooks tests/unit/lib/lemonsqueezy` | all pass      |
| Lint      | `bun run lint:biome -- src/app/\(app\)/webhooks/lemonsqueezy/route.ts`   | exit 0        |

## Scope

**In scope:**

- `src/app/(app)/webhooks/lemonsqueezy/route.ts` (only `findOrCreateUser` and, if needed, the callsites that pass `custom_data`).
- A new or extended test in `tests/unit/server/webhooks/` (or wherever the lemonsqueezy webhook tests live — see Step 4).

**Out of scope:**

- The signature verification logic (already correct).
- The idempotency check (planned separately in plan 004 — do not fold in).
- Stripe / Polar webhook handlers.
- The `customData.user_id` semantics in checkout flow (anyone documenting how
  Shipkit creates LemonSqueezy checkouts may need to revisit — leave a TODO
  for follow-up, do not change the checkout path).

## Git workflow

- Branch: `advisor/002-lemonsqueezy-customdata-ownership`
- One commit: `fix(webhooks): require custom_data.user_id to match webhook email in LemonSqueezy handler`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Require `custom_data.user_id` to match the verified email's user

Replace the `if (customData?.user_id) { … return existingUser.id; }` branch
with one that confirms the looked-up user's email matches `userEmail`. Code
shape:

```ts
if (customData?.user_id) {
  const existingUser = await db?.query.users.findFirst({
    where: eq(users.id, customData.user_id),
  });
  if (existingUser && existingUser.email?.toLowerCase() === userEmail.toLowerCase()) {
    return existingUser.id;
  }
  // custom_data.user_id did not match the webhook's billing email — ignore the hint
  // (do NOT log the rejected id at info-level; rejected hints are normal and noisy)
  logger.debug("Ignoring custom_data.user_id whose email does not match webhook email", {
    suppliedUserId: customData.user_id,
    matched: !!existingUser,
  });
}
// fall through to email lookup
```

Rationale: the email in the webhook comes from the verified LemonSqueezy
order — that's the buyer's authoritative identifier. `custom_data.user_id`
becomes a convenience hint to avoid an email lookup, but is only honored
when it points at the user with the matching email.

**Verify**: `bun run typecheck` — no new errors.

### Step 2: Confirm no other place in this file consumes `custom_data` for identity

Run: `grep -n "custom_data\|customData" src/app/\(app\)/webhooks/lemonsqueezy/route.ts`

For each hit other than the `findOrCreateUser` call: confirm it is used only
for metadata storage or display, not for an `eq(users.id, …)` lookup or
authorization decision. List the surviving usages in the PR description so a
reviewer doesn't have to re-grep.

### Step 3: Confirm `users.email` is unique

`grep -nA2 "email:" src/server/db/schema.ts | head -20`

The `email` column on `users` must be `unique()`. If it isn't, the
email-fallback identity check is also unsafe (two users could collide). If
the column is NOT unique, **STOP** and report — that's a deeper issue than
this plan.

### Step 4: Add a regression test

Look for existing webhook tests:
`find tests -path '*webhook*' -o -name '*lemonsqueezy*'`

If `tests/unit/lib/lemonsqueezy.test.ts` (or similar) exists, extend it. If
not, create `tests/unit/server/webhooks/lemonsqueezy-find-or-create-user.test.ts`
that imports the `findOrCreateUser` function directly (export it or extract
it to a sibling module if not already exported).

Tests to write (3):

1. **Hint accepted when matching:** given a `users` row with id `X` and email `alice@example.com`, calling `findOrCreateUser("alice@example.com", undefined, { user_id: "X" })` returns `X` and does NOT call `userService.findOrCreateUserByEmail`.
2. **Hint ignored when email mismatch:** given a `users` row with id `X` and email `attacker@evil.com`, calling `findOrCreateUser("alice@example.com", undefined, { user_id: "X" })` falls through to `findOrCreateUserByEmail("alice@example.com")` and returns whatever that produces.
3. **No custom_data still works:** calling `findOrCreateUser("alice@example.com", undefined, undefined)` falls through cleanly.

If `findOrCreateUser` is private (not exported), the cleanest fix is to make
it exported (`export async function findOrCreateUser` — it's a webhook
handler module, no encapsulation cost). That's allowed by this plan.

**Verify**: `bun run test -- tests/unit/server/webhooks/lemonsqueezy-find-or-create-user.test.ts` — 3 tests pass.

### Step 5: Manual smoke test against a test webhook

If you have a Lemon Squeezy test-mode order, replay it via the dashboard's
"send test webhook" feature and confirm the existing path still works for
real orders (where `custom_data.user_id` either matches or is absent).

## Test plan

- New file: `tests/unit/server/webhooks/lemonsqueezy-find-or-create-user.test.ts` (or extend an existing webhook test file if one is found in Step 4).
- Tests as enumerated above (3).
- Model after: `tests/unit/lib/utils.test.ts` for general structure, or whichever existing test mocks the Drizzle `db?.query.users.findFirst` shape.
- Verification: `bun run test -- tests/unit/server/webhooks/lemonsqueezy-find-or-create-user.test.ts` → all pass.

## Done criteria

- [ ] `bun run typecheck` exits 0 (no new errors versus baseline).
- [ ] `bun run test -- tests/unit/server/webhooks/lemonsqueezy-find-or-create-user.test.ts` exits 0 with new tests.
- [ ] `grep -n "existingUser.email" src/app/\(app\)/webhooks/lemonsqueezy/route.ts` shows the new comparison.
- [ ] `git status` shows only the two files (route + test) plus optionally `tests/unit/server/webhooks/` (new dir).
- [ ] `plans/README.md` status row for 002 updated.

## STOP conditions

- `users.email` is NOT `unique()` (Step 3) — fix that first.
- `findOrCreateUser` is consumed by code outside the webhook handler (Step 2 turns up an unexpected caller) — confirm none of those callers pass attacker-controlled `customData`.
- A reviewer requests folding in the idempotency-race fix — politely refuse; that's plan 004.

## Maintenance notes

- The checkout flow (wherever Shipkit assembles the LemonSqueezy checkout
  URL) currently inserts `custom_data: { user_id: session.user.id }` on the
  legitimate path. That stays useful — the new code now correctly _trusts_
  the hint only when it agrees with the verified billing email. Don't remove
  the checkout-side population.
- If LemonSqueezy ever ships a `custom_data` signing scheme distinct from the
  webhook body, revisit this and trust the signed hint directly.
- Reviewer should scrutinize: the email comparison is case-insensitive (LS
  sends mixed-case sometimes), and the early-return only happens on a _positive_
  match — every other shape falls through to the email path.

## Backfill candidate for `shipkit-io/bones`

Yes — same code in bones. Backfill after merge.
