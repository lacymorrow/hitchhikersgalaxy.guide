# Plan 001: Enforce team membership before returning projects on `GET /api/projects`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- src/app/\(app\)/api/projects/route.ts src/server/services/project-service.ts`
> If either in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `origin/security` branch merged to `main` (introduces `requireSessionOrResponse` and the `teamService.getTeamMembers` pattern used in `src/server/actions/teams.ts`). If for some reason the security branch will not land, replace `requireSessionOrResponse` calls with inline `const session = await auth(); if (!session?.user?.id) return NextResponse.json({error:"Authentication required"}, {status:401});`.
- **Category**: security (IDOR)
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/222

## Why this matters

`GET /api/projects?teamId=…` requires a logged-in session (on `origin/security`)
but does **not** verify that the calling user is a member of `teamId`. Any
authenticated user can enumerate the `projects` of any team by changing the
query string. The security audit doc (`SECURITY-AUDIT-2026-06-03.md`) tightened
the _server actions_ in `teams.ts` and `projects.ts` to require team
membership, but missed this API route. This plan closes the gap.

A grep also finds other team-scoped read paths in `projectService` that may
have the same shape. The plan scopes them in too.

## Current state

The route on `origin/security` (the branch this plan assumes is merged):

```ts
// src/app/(app)/api/projects/route.ts:10-26 (on origin/security)
export async function GET(request: NextRequest) {
  try {
    const result = await requireSessionOrResponse();
    if (result instanceof NextResponse) return result;

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
    }

    const projects = await projectService.getTeamProjects(teamId);   // ← no membership check
    return NextResponse.json({ projects });
  } catch (error) { … }
}
```

The service it calls:

```ts
// src/server/services/project-service.ts:110-126
async getTeamProjects(teamId: string) {
  if (!db) return LocalProjectStorage.getTeamProjects(teamId);
  return db?.query.projects.findMany({
    where: eq(projects.teamId, teamId),
    with: { members: { with: { user: true } }, team: true },
  });
}
```

The repo convention for "is this user a team member" is the `requireTeamRole`
helper introduced on `origin/security` in `src/server/actions/teams.ts`:

```ts
// src/server/actions/teams.ts (on origin/security) — pattern to follow
async function requireTeamRole(teamId: string, allowedRoles: readonly string[]) {
  const { userId } = await requireSession();
  const members = await teamService.getTeamMembers(teamId);
  const me = members?.find((m) => m.userId === userId);
  if (!me) ErrorService.throwForbidden("You are not a member of this team.");
  if (!allowedRoles.includes(me.role))
    ErrorService.throwForbidden(`This action requires one of: ${allowedRoles.join(", ")}.`);
  return { userId, role: me.role };
}
```

For a _read_ (GET) we only need membership, not a particular role.

## Commands you will need

| Purpose   | Command                                                                                     | Expected on success               |
| --------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| Install   | `bun install`                                                                               | exit 0                            |
| Typecheck | `bun run typecheck`                                                                         | exit 0; no new errors vs baseline |
| Tests     | `bun run test -- tests/unit/server/services/project`                                        | all pass; new tests pass          |
| Lint      | `bun run lint:biome -- src/app/\(app\)/api/projects src/server/services/project-service.ts` | exit 0 on touched files           |

Baseline note: the repo currently builds with `typescript.ignoreBuildErrors:
true` (see plan 010). For this plan, treat "no _new_ type errors introduced
by your changes" as the bar.

## Scope

**In scope:**

- `src/app/(app)/api/projects/route.ts`
- `src/server/services/project-service.ts`
- A new test file: `tests/unit/server/services/project-service.test.ts` (if absent)

**Out of scope** (do NOT touch even though related):

- `src/server/actions/projects.ts` — fixed on `origin/security`; do not re-fix.
- The legacy `LocalProjectStorage` path in `project-service.ts` — keep behavior unchanged for the no-DB local dev case (it's only reached when `db` is undefined).
- Public response shape — the client code consuming `/api/projects` expects `{ projects: [...] }`. Do not change the envelope.

## Git workflow

- Branch: `advisor/001-projects-team-membership`
- One commit covering route + service + test, following conventional commits (see `git log --oneline -5`): `fix: enforce team membership on GET /api/projects`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add team membership check to the route handler

In `src/app/(app)/api/projects/route.ts`, after `const result = await requireSessionOrResponse();` and the `teamId` validation, add a membership check before calling `getTeamProjects`. Pattern:

```ts
const { session } = result; // requireSessionOrResponse returns { session, userId } per the security branch
const userId = session.user.id;

const isMember = await projectService.isUserInTeam(userId, teamId);
if (!isMember) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

If `requireSessionOrResponse` returns `{ userId }` directly (verify by reading
`src/server/auth/require-session.ts` introduced on the security branch),
destructure `userId` instead.

**Verify**: `bun run typecheck` — no new errors.

### Step 2: Add `isUserInTeam(userId, teamId)` to the project service

You will either find a matching helper on `teamService` (look first:
`grep -n "isUserInTeam\|isTeamMember" src/server/services/team-service.ts`)
and use it, or add a small helper to `projectService` (since the route already
imports `projectService`). Recommended: use `teamService.getTeamMembers(teamId)`
(it exists on `origin/security`) and check membership inline as Step 1. If you
prefer a service method for reuse, add this to `project-service.ts`:

```ts
async isUserInTeam(userId: string, teamId: string): Promise<boolean> {
  if (!db) return LocalProjectStorage.isUserInTeam?.(userId, teamId) ?? false;
  const row = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
  });
  return !!row;
}
```

Add `import { teamMembers } from "@/server/db/schema";` and `import { and, eq } from "drizzle-orm";` if not already imported.

**Verify**: `grep -n "isUserInTeam\|isTeamMember\|getTeamMembers" src/server/services/team-service.ts src/server/services/project-service.ts` — confirm the function you ended up using exists.

### Step 3: Audit other read paths on `projectService` for the same gap

Run: `grep -nE "projectService\.\\w+|getTeamProjects|getUserProjects|getProjectMembers" src/`

For every caller from a route handler or server action: confirm it either
already enforces ownership/membership or is hard-coded to the session user's
own ID. Document findings in the PR description. **If a second instance of
the same IDOR exists, do not fix it in this PR** — open a new plan (or
extend `plans/README.md`'s status table with a follow-up row). One plan,
one fix, easier review.

### Step 4: Add a regression test

Create `tests/unit/server/services/project-service.test.ts` if it doesn't
exist. Model after `tests/unit/server/services/team/team-service.test.ts`
(structure: describe-block per method, Drizzle mocked via the patterns used
there).

Tests to write (4):

1. `getTeamProjects(teamId)` returns the projects for a team (happy path).
2. `isUserInTeam(userId, teamId)` returns `true` when a membership row exists.
3. `isUserInTeam(userId, teamId)` returns `false` when no row exists.
4. (Route-level, optional) hit the route handler with a `teamId` the session user is NOT a member of; expect 403. If the route is hard to test without an integration harness, skip and rely on the service test plus an e2e check.

**Verify**: `bun run test -- tests/unit/server/services/project-service.test.ts` — 3 (or 4) new tests pass.

### Step 5: Manual smoke test

Run `bun dev`, log in as a user, find a `teamId` for a team you are NOT a
member of (use Drizzle Studio: `bun run db:studio`), and `curl
http://localhost:3000/api/projects?teamId=<not-yours>` with your session
cookie. Expect 403.

## Test plan

- New file: `tests/unit/server/services/project-service.test.ts`
- Tests (named): `getTeamProjects returns projects for a team`, `isUserInTeam returns true for a member`, `isUserInTeam returns false for a non-member`.
- Model after: `tests/unit/server/services/team/team-service.test.ts`.
- Verification: `bun run test -- tests/unit/server/services/project-service.test.ts` → all pass.

## Done criteria

- [ ] `bun run typecheck` exits 0 (or: no new errors versus pre-change baseline).
- [ ] `bun run test -- tests/unit/server/services/project-service.test.ts` exits 0 with the new tests.
- [ ] Manual smoke test (Step 5): non-member returns 403; member returns 200 with projects.
- [ ] `grep -n "getTeamProjects(teamId)" src/app/\(app\)/api/projects/route.ts` shows the membership check above the call.
- [ ] Only `src/app/(app)/api/projects/route.ts`, `src/server/services/project-service.ts`, and the new test file appear in `git status`.
- [ ] `plans/README.md` status row for 001 updated.

## STOP conditions

Stop and report back (do not improvise) if:

- `origin/security` has NOT been merged — the `requireSessionOrResponse`
  import in Step 1 will not resolve. Report so the operator merges security
  first or chooses the fallback `await auth()` shape described under
  "Depends on".
- The route file on `main` looks substantially different from the "Current
  state" excerpt (someone refactored it since `6358b2b2`).
- Step 3 finds more than one other unprotected read — the right action is
  to write a follow-up plan, not bundle.
- `teamService.getTeamMembers` does not exist (it was introduced on
  `origin/security`); STOP and choose the fallback inline-query shape in
  Step 2.

## Maintenance notes

- Future addition of an admin override (e.g. "site admins can read any team's
  projects") goes through the existing `isAdmin()` helper — add it to the
  same membership check, not as a parallel branch.
- If a `requirePermission(userId, teamId, "team:read")` helper lands later
  (RBAC is gated by plan 003), the inline membership check here should be
  swapped for it.
- Reviewer should scrutinize: the membership check sits BEFORE the service
  call (not after), and any new route added to `src/app/(app)/api/projects/`
  inherits the same pattern.

## Backfill candidate for `shipkit-io/bones`

Yes — this is a security fix; bones inherits the same vulnerable code.
After this lands in shipkit, port the same change to bones.
