# Plan 003: Resolve the dangling RBAC role check in `src/server/auth.ts`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. If anything in the "STOP conditions" section occurs,
> stop and report. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- src/server/auth.ts src/server/services/rbac.ts`
> If either file changed, compare the "Current state" excerpt below against
> the live code before proceeding.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none.
- **Category**: security (incomplete authorization)
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/224

## Why this matters

`authWithOptions` accepts a `role?: UserRole` parameter and is exported as
the codebase's primary `auth()` helper, but the role-check branch is
commented out with a `// TODO: RBAC`. Code in the repo passes `role` to
`auth(…)` expecting enforcement (it's in the function signature and JSDoc).
Three failure modes:

1. Routes/pages that call `auth({ protect: true, role: "admin" })` get _only_
   the session check — any logged-in user passes.
2. Downstream forks read CLAUDE.md (which advertises RBAC) and trust it.
3. The `RBACService` exists (`src/server/services/rbac.ts`, ~340 lines) and
   is invoked from other places (`hasPermission`), so the system is partly
   built and partly stubbed — confusing to maintainers.

The right answer is a binary: **enforce** the check using `RBACService`, or
**delete** the dead parameter. Don't leave it.

## Current state

```ts
// src/server/auth.ts:165-180
if (protect && !session?.user?.id) {
  return handleRedirect(errorCode ?? STATUS_CODES.AUTH.code);
}

// TODO: RBAC
// if (role && session?.user?.role !== role) {
//   return handleRedirect(errorCode ?? STATUS_CODES.AUTH_ROLE.code); // TODO: We shouldn't sign them out
// }

return session;
```

The `RBACService` exposes `hasPermission(userId, permissionKey, context?)`
(`src/server/services/rbac.ts:95-138`). There is a `getUserRoles` private
method (line 138).

Callers of `auth({ role })` — find them with:

```
grep -rnE "auth\\(\\s*\\{[^}]*role" src/
```

## Commands you will need

| Purpose   | Command                                                                                    | Expected         |
| --------- | ------------------------------------------------------------------------------------------ | ---------------- |
| Install   | `bun install`                                                                              | exit 0           |
| Typecheck | `bun run typecheck`                                                                        | no new errors    |
| Tests     | `bun run test -- tests/unit/server/auth-providers.test.ts tests/unit/server/services/rbac` | pass + new tests |
| Lint      | `bun run lint:biome -- src/server/auth.ts src/server/services/rbac.ts`                     | exit 0           |

## Scope

**In scope:**

- `src/server/auth.ts` (the `authWithOptions` function and exports).
- `src/server/services/rbac.ts` only if you must add a `getUserRole` accessor (Step 2).
- A new test file under `tests/unit/server/services/rbac.test.ts` if absent.
- The callsites grep finds in Step 1 — to either confirm they expect enforcement (Path A) or to drop the `role` argument (Path B).

**Out of scope:**

- The broader RBAC redesign discussed in older planning docs.
- Adding new permissions or roles to the schema.
- Migrating from "role" string to a permission-key model.
- The `authWithOptions` redirect plumbing.

## Choose Path A or Path B at Step 1

**Path A — Enforce.** If grep in Step 1 finds ≥1 callsite passing `role`
that clearly _expects_ admin gating (e.g. admin layouts, admin API routes),
take Path A: implement the check.

**Path B — Remove.** If no callsite passes `role` (or all of them already
have their own enforcement elsewhere), take Path B: delete the parameter
and the dead comments. Simpler, smaller blast radius. The repo's existing
admin gates can keep using `isAdmin()` independently.

The plan covers both. **Do not do both.**

## Git workflow

- Branch: `advisor/003-rbac-resolve`
- One commit: `fix(auth): {enforce|remove} dangling RBAC role check` (pick the verb that matches your path)

## Steps

### Step 1: Inventory callsites and pick a path

```
grep -rnE "auth\\(\\s*\\{[^}]*role\\s*:" src/ --include="*.ts" --include="*.tsx"
grep -rnE "authWithOptions\\(" src/ --include="*.ts" --include="*.tsx"
```

Record every result in the PR description. Decision rule:

- **0 callsites pass `role`** → Path B.
- **≥1 callsite passes `role` for actual gating** → Path A.
- **Mixed / unclear** → STOP and report; the operator picks.

### Step 2 (Path A only): Add a `getUserRole(userId)` accessor to `RBACService`

`src/server/services/rbac.ts` has `getUserRoles` (private). Expose a public
`getUserRole(userId): Promise<string | null>` that returns the highest-rank
role name the user holds (e.g. `"admin"` if any of their roles is admin),
or `null` if none. The role hierarchy lives in `src/server/services/rbac.ts`
near the role definitions — read it carefully so the hierarchy is preserved.

Pattern:

```ts
async getUserRole(userId: string): Promise<string | null> {
  const roles = await this.getUserRoles(userId);
  if (!roles?.length) return null;
  // Return the highest-rank role; rank order matches existing constant if any.
  const RANK = ["admin", "owner", "editor", "user"]; // adjust to repo's actual order
  for (const r of RANK) if (roles.some((row) => row.name === r)) return r;
  return roles[0]!.name;
}
```

If `getUserRoles` already returns sorted, just take the first.

### Step 3 (Path A only): Wire the check into `authWithOptions`

Replace the commented block with:

```ts
if (role && session?.user?.id) {
  const userRole = await rbacService.getUserRole(session.user.id);
  if (userRole !== role) {
    return handleRedirect(errorCode ?? STATUS_CODES.AUTH_ROLE.code);
  }
}
```

Add `import { rbacService } from "@/server/services/rbac";` at the top if
not present.

Note: the cached export (`cachedAuth = cache(authWithOptions)`) wraps this
function in React `cache()`. The role check will be cached per
`(props, nextUrl, role, …)` tuple per request — that's intended.

### Step 4 (Path B only): Remove the dead parameter and comments

In `src/server/auth.ts`:

1. Remove `role?: UserRole` from the props type.
2. Remove the `// TODO: RBAC` block (lines 170-173 on `6358b2b2`).
3. Remove unused `UserRole` import if no longer used (run typecheck to see).

In every callsite found in Step 1: drop the `role: …` property.

### Step 5: Tests

Path A: Create `tests/unit/server/services/rbac.test.ts` (or extend if it exists). Tests:

- `getUserRole` returns the highest-rank role for a multi-role user.
- `getUserRole` returns `null` for a user with no roles.
- `getUserRole` returns the only role when one is held.

Path B: No new tests; but add a single guard test in `tests/unit/server/auth-providers.test.ts` (or a new file) that imports `authWithOptions` and asserts the function shape no longer accepts `role`.

**Verify**: `bun run test -- <the file you touched>` — all pass.

### Step 6: Manual smoke test (Path A only)

Log in as a non-admin user. Hit a route that calls `auth({ role: "admin" })`. Expect the redirect (or 401/403 — match whatever `handleRedirect` does). Log in as an admin: expect the page.

## Test plan

- See Step 5. Tests vary by path.
- Verification: `bun run test` exits 0 with new tests included.

## Done criteria

- [ ] Path chosen and documented in PR description.
- [ ] `bun run typecheck` exits 0 (no new errors versus baseline).
- [ ] `bun run test` exits 0 with new tests included.
- [ ] `grep -n "TODO: RBAC" src/server/auth.ts` returns nothing.
- [ ] If Path A: `grep -n "rbacService.getUserRole\|rbacService\\.hasPermission" src/server/auth.ts` shows the check.
- [ ] If Path B: `grep -n "role" src/server/auth.ts` shows no parameter-typed `role` left.
- [ ] `plans/README.md` status row for 003 updated.

## STOP conditions

- Step 1 turns up mixed/unclear callsites — operator picks the path.
- Path A: `getUserRoles` returns a shape you don't understand from a quick read of `rbac.ts` (e.g. caching layer, async loader pattern that fights you). Don't rebuild it; pick Path B and document why.
- Path A: there's already an existing `requireRole` or `requirePermission`
  helper you missed — use it instead of inventing a new one. STOP and refactor.

## Maintenance notes

- Path A: a future migration from string-role to permission-key gating
  (`auth({ permission: "team:write" })`) is now a straightforward addition.
  Build it on top of `rbacService.hasPermission`, not by extending the role
  string check.
- Either path: the `STATUS_CODES.AUTH_ROLE` code stays meaningful; don't
  rename it casually — it's used by the redirect page to render the right
  message.
- Reviewer should scrutinize: that no callsite was missed; that admin layouts
  and admin API routes pass the check end-to-end; that the cached wrapper
  isn't holding stale role decisions across requests.

## Backfill candidate for `shipkit-io/bones`

Yes — bones has the same dangling comment if it tracks shipkit's auth.ts.
Backfill after merge.
