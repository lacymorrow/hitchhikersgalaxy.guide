# Plan 011: Memoize `isAdmin()` per request

> **Executor instructions**: Follow this plan step by step. If anything in
> the "STOP conditions" section occurs, stop and report. When done, update
> the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- src/server/services/admin-service.ts`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none.
- **Category**: performance
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/232

## Why this matters

`isAdmin(...)` (in `src/server/services/admin-service.ts`) consults
multiple sources per call:

- The Drizzle `users` table.
- The RBAC roles table.
- Payload CMS (network I/O).

It is called 3+ times per admin request from independent code paths:

- `src/app/(app)/(dashboard)/_hooks/use-dashboard-data.ts:22`
- `src/app/(app)/(admin)/layout.tsx:21`
- `src/app/(app)/api/download/route.ts:54`

Each call repeats the same DB and Payload reads in the same request.
Wrapping with React's `cache()` collapses them to one call per
`(userId|email)` per request without any invalidation concerns — the cache
naturally scopes to the request lifetime.

## Current state

```ts
// src/server/services/admin-service.ts:24-95 (approximate)
export async function isAdmin({
  userId,
  email,
}: {
  userId?: string;
  email?: string;
}): Promise<boolean> {
  // … reads users table
  // … reads roles table
  // … queries Payload CMS
}
```

(Read the actual file to confirm shape — line numbers may have shifted.)

Call sites (from grep):

```
src/app/(app)/(dashboard)/_hooks/use-dashboard-data.ts:22
src/app/(app)/(admin)/layout.tsx:21
src/app/(app)/api/download/route.ts:54
```

## Commands you will need

| Purpose   | Command                                                      | Expected       |
| --------- | ------------------------------------------------------------ | -------------- |
| Install   | `bun install`                                                | exit 0         |
| Typecheck | `bun run typecheck`                                          | no new errors  |
| Tests     | `bun run test`                                               | no regressions |
| Lint      | `bun run lint:biome -- src/server/services/admin-service.ts` | exit 0         |

## Scope

**In scope:**

- `src/server/services/admin-service.ts` — wrap `isAdmin` (and only this) in
  React `cache()`. Do not modify its signature or behavior.

**Out of scope:**

- Cross-request caching (Redis / cacheService). Different problem; not
  needed for this win.
- Changing `isAdmin`'s data sources (consolidating roles vs Payload — a
  cleanup, not a perf fix).
- Memoizing other admin helpers; do those individually if profiling
  reveals a need.

## Git workflow

- Branch: `advisor/011-cache-isadmin`
- One commit: `perf(admin): memoize isAdmin per request with React cache`

## Steps

### Step 1: Wrap `isAdmin` with React `cache`

In `src/server/services/admin-service.ts`:

```ts
import { cache } from "react"; // add to imports

// existing implementation, rename to _isAdmin if exported as the public function name:
async function _isAdmin({ userId, email }: { userId?: string; email?: string }): Promise<boolean> {
  // … existing body unchanged
}

export const isAdmin = cache(_isAdmin);
```

Important: `cache()` keys on argument identity. Because `isAdmin` takes an
object, two calls with shape-equal but reference-unequal objects do NOT
hit the cache. Two options:

**Option A — accept the limitation.** Most callers pass the same destructured
session through the same hook; they happen to share refs. Tolerable, not
ideal.

**Option B — flatten the API.** Refactor `isAdmin` to take `(userId, email)` as positional params:

```ts
async function _isAdmin(userId?: string, email?: string): Promise<boolean> { … }
export const isAdmin = cache(_isAdmin);
```

Then update the 3 call sites: `isAdmin(undefined, session.user.email)` becomes acceptable.

Pick Option B if the call sites are few (they are — three known). Option A if you're avoiding ANY signature change in this PR. Document the choice in the PR description.

### Step 2: Update call sites (Option B only)

If Option B chosen, update:

- `src/app/(app)/(dashboard)/_hooks/use-dashboard-data.ts:22`
- `src/app/(app)/(admin)/layout.tsx:21`
- `src/app/(app)/api/download/route.ts:54`

And any others found by:
`grep -rn "isAdmin\\(" src/ --include="*.ts" --include="*.tsx"`

### Step 3: Add a test or instrumentation note (lightweight)

Tests for `cache()` behavior aren't easy without React's runtime context.
Skip a dedicated test; instead, add a one-line `logger.debug` inside `_isAdmin`
that logs "isAdmin invoked". With caching, the line should appear once per
request per user. In dev mode, an admin loading the admin dashboard should
show one "isAdmin invoked" line, not three.

### Step 4: Smoke test in dev

1. `bun dev`.
2. Sign in as an admin user.
3. Open the admin dashboard.
4. Check server logs: only one "isAdmin invoked" line for the page load.

## Test plan

- No new unit tests (React `cache()` requires a runtime that's awkward to
  test in Vitest without setup).
- Verification by dev-mode log instrumentation as in Step 3 + Step 4.
- Existing test suite must still pass.

## Done criteria

- [ ] `bun run typecheck` exits 0.
- [ ] `bun run test` exits 0.
- [ ] `grep -n "cache(_isAdmin)" src/server/services/admin-service.ts` shows the wrap.
- [ ] Dev-mode smoke: single "isAdmin invoked" log per admin page load.
- [ ] `plans/README.md` status row for 011 updated.

## STOP conditions

- `isAdmin` is called from middleware (`src/middleware.ts`). React `cache()`
  doesn't work in middleware. If true, fall back to a `WeakMap` keyed by
  request, OR don't cache there and accept the duplicate cost only in
  middleware.
- `isAdmin` is called outside a React request context (e.g. from a Node.js
  worker, a cron handler). `cache()` is a no-op there but harmless — keep
  going.
- A caller passes a freshly-constructed argument object on every render in
  a way that defeats caching. Profile; if found, switch to Option B or
  introduce a normalizer.

## Maintenance notes

- This is request-scoped caching; it expires automatically. Don't bolt on
  manual invalidation.
- If admin roles can change _during_ a request (extremely unlikely), this
  caching is wrong. They cannot today; document the assumption in a code
  comment.
- Reviewer should scrutinize: only `isAdmin` is wrapped, not unrelated
  helpers; no signature-change creep in this PR.

## Backfill candidate for `shipkit-io/bones`

Yes — same code in bones. Backfill after merge.
