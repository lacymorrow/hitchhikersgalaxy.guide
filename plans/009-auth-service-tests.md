# Plan 009: Characterization tests for `auth-service.ts`

> **Executor instructions**: Follow this plan step by step. If anything in
> the "STOP conditions" section occurs, stop and report. When done, update
> the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- src/server/services/auth-service.ts`

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH (passwords + Payload sync are security-critical; bad tests give false confidence)
- **Depends on**: none.
- **Category**: tests
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/230

## Why this matters

`auth-service.ts` is ~993 lines covering password hashing, Payload-CMS
credential sync, and the bridge between `users` (Drizzle) and Payload's
own user collection. It has zero tests. Account-creation and credential
validation are the most security-critical paths in the codebase and the
multi-system sync logic is the kind that breaks subtly when one of the
three auth implementations (NextAuth, Better-Auth, Payload credentials)
changes.

This plan is _characterization_ — capture current behavior so future
changes land safely.

## Current state

- File: `src/server/services/auth-service.ts` (~993 lines).
- Tests inventory:
  - `tests/unit/server/auth-providers.test.ts` — tests the _provider list configuration_, not `auth-service`.
  - No file matches `tests/**/*auth-service*`.
- Service likely exports (read the file's `export` block to confirm):
  - `hashPassword` / `verifyPassword` (scrypt-based, security-critical).
  - `findOrCreateUserByEmail` (called from webhooks — see plans 002, 004).
  - `ensureUserExists`.
  - `ensureUserSynchronized` (the Payload sync — most likely fragile path).
  - `validateCredentials`.
- `bcrypt`/`scrypt` usage: search `crypto.scrypt` or `bcrypt` in the file
  to identify the hashing primitive.
- Payload integration: search `getPayload` or `payload.find`/`payload.create`
  for the sync points.

## Commands you will need

| Purpose         | Command                                                           | Expected       |
| --------------- | ----------------------------------------------------------------- | -------------- |
| Install         | `bun install`                                                     | exit 0         |
| Tests (focused) | `bun run test -- tests/unit/server/services/auth-service.test.ts` | new tests pass |
| Tests (full)    | `bun run test`                                                    | no regressions |

## Scope

**In scope:**

- New file: `tests/unit/server/services/auth-service.test.ts`.
- A simple fixture (Payload mock helper, scrypt assertions) inside the test
  file or under `tests/unit/server/services/__fixtures__/`.

**Out of scope:**

- Refactoring `auth-service.ts` itself.
- Migrating away from scrypt or changing hashing params.
- Tests for the OAuth callback flows (those live in NextAuth's config and
  belong with `auth-providers.test.ts` if anywhere).
- The Better-Auth or Clerk surfaces — separate code paths.
- Integration tests against a real Payload instance.

## Git workflow

- Branch: `advisor/009-auth-service-tests`
- One commit: `test(auth-service): characterization suite for password hashing, user creation, and Payload sync`

## Steps

### Step 1: Re-read the service cold

Open `src/server/services/auth-service.ts` end-to-end. Don't trust the
file's section comments; trust the code. Make notes (in your scratchpad,
not in the test file) of:

- Every exported function and its parameter shape.
- Every external dependency (`db`, `payload`, `crypto`, `bcrypt`, `env`).
- Every place that throws or returns a sentinel value.

### Step 2: Read the exemplar tests

`tests/unit/server/services/team/team-service.test.ts` and
`tests/unit/server/services/deployment-service.test.ts`. Note the mocking
style (`vi.mock`, fixture loading). Match it.

### Step 3: Scaffold the test file

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({
  db: {
    query: { users: { findFirst: vi.fn(), findMany: vi.fn() } },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Payload mock — mirror the actual surface the service uses
vi.mock("@/lib/payload/get-payload", () => ({
  getPayloadClient: vi.fn(async () => ({
    find: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  })),
}));

import { authService } from "@/server/services/auth-service"; // confirm the export name

describe("authService", () => {
  beforeEach(() => vi.clearAllMocks());
  // tests
});
```

### Step 4: Author the tests (priority-ordered)

Six tests minimum:

1. **`hashPassword` produces a unique hash for the same password.** Call
   it twice with the same plaintext; expect two different output strings
   (different salts). Both should `verifyPassword(plain, hash)` → true.
   This is the most important auth test in the file; do not skip.

2. **`verifyPassword` returns true for a correct password.** Hash, then
   verify, then expect true.

3. **`verifyPassword` returns false for the wrong password.** Same hash,
   different plaintext → false. Also: returns false for malformed hashes
   without throwing.

4. **`findOrCreateUserByEmail` returns existing user when found.** Mock
   `db.query.users.findFirst` to return a row. Expect `created === false`,
   `user` matches the row, no `db.insert` call.

5. **`findOrCreateUserByEmail` creates a new user when not found.** Mock
   `findFirst` to return undefined; mock `db.insert(...).values(...).returning()`
   to return the new row. Expect `created === true`, `user` matches.

6. **`ensureUserSynchronized` (or whatever the Payload-sync method is
   called) — creates a Payload user when missing on the Drizzle-existing
   user path.** Mock the Payload client to return no existing user on
   `find`; expect `payload.create` was called with the right shape.

If `ensureUserSynchronized` is not exported / not the right name, replace
with whichever sync function exists. The goal is to capture the contract:
"a Drizzle user exists → Payload user exists with matching fields."

### Step 5: Negative-path tests (worth the effort)

Two more:

7. **Password hash with empty string is rejected** (if the implementation
   throws or returns a sentinel for empty input, lock that in).

8. **`findOrCreateUserByEmail` is case-insensitive on email.** Insert a
   user with `Alice@Example.com`; look them up by `alice@example.com`;
   expect a hit. (Verify behavior first; the service might already
   normalize — codify whichever way it currently works.)

### Step 6: Run and stabilize

`bun run test -- tests/unit/server/services/auth-service.test.ts`

scrypt with default params is slow (intentional). Two or three hashing
tests at default params is fine; if the test takes >10 seconds, scope down
to one hashing round-trip and use shorter `N` only inside tests by
re-importing with a constant — _do not_ lower the production cost factor.

### Step 7: Full suite

`bun run test` — no regressions.

## Test plan

- New file: `tests/unit/server/services/auth-service.test.ts`.
- ~8 tests as enumerated.
- Model after: `tests/unit/server/services/team/team-service.test.ts`.
- Verification: `bun run test -- <file>` exits 0; full suite still green.

## Done criteria

- [ ] `bun run test -- tests/unit/server/services/auth-service.test.ts` exits 0 with ≥ 6 new tests.
- [ ] `bun run test` exits 0 (no regressions).
- [ ] At least one explicit hash + verify round-trip test exists (Test 1 + 2 above).
- [ ] At least one Payload-sync test exists (Test 6).
- [ ] `plans/README.md` status row for 009 updated.

## STOP conditions

- `payload` cannot be mocked at the boundary because the service imports
  `payload` config statically at module top with side effects. STOP and
  recommend a refactor to use `getPayloadClient()` lazily — that refactor
  is a separate plan, not bundled here.
- scrypt is too slow on the CI test runner (>30s for a single test). Read
  the params; if intentionally high (e.g. for HSM-grade hashing), narrow
  test 1+2 to a single round-trip and document. Do not lower production
  cost factors.
- Bcrypt is used instead of scrypt (Step 1 grep might surface this).
  Adapt tests to use the `bcrypt.compare` shape; the test list doesn't
  change in spirit.

## Maintenance notes

- These tests document _current_ hashing behavior. A future migration to
  argon2 or a different scrypt cost factor should write a migration plan
  (re-hash on next login) and update these tests _intentionally_, not
  silently.
- The Payload sync test is the most likely to break under Payload version
  upgrades — flag it for re-review during major bumps.
- Reviewer should scrutinize: the password tests verify both directions
  (hash AND verify); the Payload mocks don't paper over real failures
  (test 6 should fail if `payload.create` is removed).

## Backfill candidate for `shipkit-io/bones`

Yes — auth code is shared.
