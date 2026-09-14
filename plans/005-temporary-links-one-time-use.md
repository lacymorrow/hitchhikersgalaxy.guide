# Plan 005: Temporary links — one-time use, stop extending expiry on read

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. If anything in the "STOP conditions" section occurs,
> stop and report. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- src/server/services/temporary-links.ts src/server/db/schema.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none.
- **Category**: security (token lifetime / replay)
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/226

## Why this matters

`getTemporaryLinkData(linkId, userId)` does two things that defeat the
purpose of a temporary link:

1. **Extends expiry on every read.** As long as the link is hit before
   it expires, the expiration clock resets to "+30 minutes from now". A
   leaked link stays usable indefinitely.
2. **No use count.** The function comments acknowledge this should be
   "one-time use" but the code reads the row and returns its `data`
   without recording the use.

Temporary links here are used for password reset / email confirmation / file
download / similar consent-bearing flows (search callers — they're in
`temporary-links.ts`'s peer files). For those flows, a one-time link is the
correct semantic; the current behavior makes a leaked link as good as a
permanent credential as long as it's polled.

## Current state

```ts
// src/server/services/temporary-links.ts (full file is short)
"use server";

import { addMinutes } from "date-fns";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/server/db";
import { temporaryLinks } from "@/server/db/schema";

const EXPIRES_IN_MINUTES = 30;

export async function createTemporaryLink({
  data,
  userId,
  type,
  expiresInMinutes = EXPIRES_IN_MINUTES,
  metadata,
}) {
  return await db
    ?.insert(temporaryLinks)
    .values({
      userId,
      type,
      data,
      expiresAt: addMinutes(new Date(), expiresInMinutes),
      metadata,
    })
    .returning();
}

// TODO: First use should record the IP address, and any subsequent uses from a different IP should be blocked
// TODO: Add a check to see if the link has been used already (limit uses)
export async function getTemporaryLinkData(linkId: string, userId: string) {
  const link = await db?.query.temporaryLinks.findFirst({
    where: and(
      eq(temporaryLinks.id, linkId),
      eq(temporaryLinks.userId, userId),
      gt(temporaryLinks.expiresAt, new Date())
    ),
  });

  // Reset the expiresAt if the link is used, so it can be used again
  if (link) {
    await db
      ?.update(temporaryLinks)
      .set({ expiresAt: addMinutes(new Date(), EXPIRES_IN_MINUTES) })
      .where(eq(temporaryLinks.id, linkId));
    return link.data;
  }

  return null;
}
```

The `temporaryLinks` table — find its definition in `schema.ts`:
`grep -nA20 "temporaryLinks\\s*=\\s*createTable" src/server/db/schema.ts`. It
needs at minimum a column to mark consumption. Likely shape: no `usedAt`
column today.

## Commands you will need

| Purpose   | Command                                                      | Expected         |
| --------- | ------------------------------------------------------------ | ---------------- |
| Install   | `bun install`                                                | exit 0           |
| Generate  | `bun run db:generate`                                        | new migration    |
| Migrate   | `bun run db:migrate`                                         | exit 0           |
| Typecheck | `bun run typecheck`                                          | no new errors    |
| Tests     | `bun run test -- tests/unit/server/services/temporary-links` | pass + new tests |

## Scope

**In scope:**

- `src/server/db/schema.ts` — add `usedAt` (timestamp, nullable) to `temporaryLinks`.
- `src/server/services/temporary-links.ts` — remove expiry extension; record `usedAt`; reject already-used links.
- A new migration.
- `tests/unit/server/services/temporary-links.test.ts` (new).

**Out of scope:**

- IP recording / IP-binding (TODO comment one). Different threat model, more
  intrusive, deserves its own plan if anyone wants it. Delete the TODO when
  removing the second TODO comment.
- The createTemporaryLink callers (don't change call shape — same signature).
- Any per-link-type policy ("downloads can be used 5 times, password resets only once"). One-time-use is the right default; if a use case needs reuse, callers can refresh the row by creating a new link.

## Git workflow

- Branch: `advisor/005-temporary-links-one-time`
- One commit: `fix(temp-links): enforce one-time use and stop extending expiry on read`

## Steps

### Step 1: Add `usedAt` to `temporaryLinks` schema

In `src/server/db/schema.ts`, find the `temporaryLinks = createTable("temporary_link"|"temporary-link", …)` block. Add:

```ts
usedAt: timestamp("used_at", { withTimezone: true }),
```

Match the column style used elsewhere in the file (`withTimezone: true` is the convention — see `purchasedAt`/`createdAt`).

### Step 2: Generate and run migration

`bun run db:generate && bun run db:migrate`

**Verify**: migration file in `drizzle/` adds `used_at`. Studio shows the column.

### Step 3: Rewrite `getTemporaryLinkData`

```ts
export async function getTemporaryLinkData(linkId: string, userId: string) {
  const link = await db?.query.temporaryLinks.findFirst({
    where: and(
      eq(temporaryLinks.id, linkId),
      eq(temporaryLinks.userId, userId),
      gt(temporaryLinks.expiresAt, new Date()),
      isNull(temporaryLinks.usedAt) // ← never been used
    ),
  });

  if (!link) return null;

  // Atomic claim: only mark as used if no one else has. If the UPDATE returns
  // 0 rows, we lost a race; treat as "already used" and return null.
  const claimed = await db
    ?.update(temporaryLinks)
    .set({ usedAt: new Date() })
    .where(and(eq(temporaryLinks.id, linkId), isNull(temporaryLinks.usedAt)))
    .returning({ id: temporaryLinks.id });

  if (!claimed || claimed.length === 0) return null;

  return link.data;
}
```

Add `isNull` to the imports: `import { and, eq, gt, isNull } from "drizzle-orm";`.

Delete the two `TODO:` comments above the function — the second one is what
this plan solves; the first (IP recording) is recorded in Scope as out of scope.

### Step 4: Tests

Create `tests/unit/server/services/temporary-links.test.ts`. Tests:

1. **Happy path:** create a link, fetch it once, get the data back.
2. **Cannot be used twice:** create a link, fetch it once (gets data), fetch it again (returns `null`).
3. **Expired returns null:** create a link with `expiresInMinutes: -5` (already expired), fetch it, get `null`.
4. **Wrong userId returns null:** create a link for user A, fetch with user B's id, get `null` (this is existing behavior; codify it).

Model after the existing services tests in `tests/unit/server/services/`
(e.g. `waitlist-service.test.ts` for shape).

**Verify**: `bun run test -- tests/unit/server/services/temporary-links.test.ts` — all 4 pass.

### Step 5: Audit callers

Run `grep -rn "getTemporaryLinkData\\|createTemporaryLink" src/`. For each
caller: confirm one-time-use semantics is acceptable. If any caller relies
on multi-use (it shouldn't, but verify): STOP and report. The likely callers
are password reset and email confirmation handlers, both of which are
naturally one-time.

## Test plan

- New file: `tests/unit/server/services/temporary-links.test.ts`.
- 4 tests (above).
- Model after: `tests/unit/server/services/waitlist-service.test.ts` for Drizzle mocking shape.
- Verification: `bun run test -- <file>` → all pass.

## Done criteria

- [ ] Drizzle migration exists and applied.
- [ ] `bun run typecheck` exits 0 (no new errors).
- [ ] `bun run test -- tests/unit/server/services/temporary-links.test.ts` exits 0.
- [ ] `grep -n "addMinutes.*EXPIRES_IN_MINUTES" src/server/services/temporary-links.ts` no longer matches inside `getTemporaryLinkData` (only the create path uses `addMinutes` for initial expiry).
- [ ] `grep -n "TODO" src/server/services/temporary-links.ts` shows neither of the two original TODOs.
- [ ] No callsite changes required (Step 5 confirmed).
- [ ] `plans/README.md` status row for 005 updated.

## STOP conditions

- Step 5 finds a caller that relies on multi-use behavior. Report so the
  caller can be changed to call `createTemporaryLink` again per use, or
  decide a different policy.
- `temporaryLinks` schema does not exist in `schema.ts` (someone moved or
  deleted it).

## Maintenance notes

- If you later want to add IP binding (the first deleted TODO), add an
  `ipAddress` column and compare against `headers().get("x-forwarded-for")`
  during the claim — but most threat models for these links care more about
  the one-time-use guarantee than IP-binding.
- For high-throughput scenarios, the read-then-update pattern is fine
  because the update's WHERE clause re-checks `isNull(usedAt)`, making the
  whole claim atomic with respect to concurrent calls. Don't replace with a
  transaction unless profiling demands it.
- Reviewer should scrutinize: the WHERE on the UPDATE includes
  `isNull(usedAt)` (not just `id`), or the race-protection is gone.

## Backfill candidate for `shipkit-io/bones`

Yes — same code. Backfill after merge.
