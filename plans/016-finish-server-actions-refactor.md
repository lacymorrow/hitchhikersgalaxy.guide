# Plan 016: Direction spike — finish or retire the server-actions-for-data-fetching cleanup

> **Executor instructions**: This is a _spike + execution_ plan. The first
> half is investigation; the second half is implementation conditioned on
> the spike's conclusion. If the spike concludes the refactor is no longer
> needed, mark the original `REFACTOR_SERVER_ACTIONS_PLAN.md` archived and
> close this plan REJECTED.
>
> **Drift check (run first)**: `git log --oneline -10 -- REFACTOR_SERVER_ACTIONS_PLAN.md` and `git log --oneline --all --since="2026-01-01" --grep="server action"`

## Status

- **Priority**: P2
- **Effort**: L (5 components × ~half-day each, or spike-only if pivot)
- **Risk**: MED
- **Depends on**: none.
- **Category**: direction / tech-debt
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/237

## Why this matters

`REFACTOR_SERVER_ACTIONS_PLAN.md` at the repo root (Feb 2026) enumerates
five client components that call server actions for read-only data
fetching:

- `dashboard-vercel-deploy.tsx`
- `polar-product-status.tsx`
- `user-drawer.tsx`
- `team-switcher.tsx`
- `project-switcher.tsx`

CLAUDE.md says explicitly: _Never use server actions for data fetching.
Use Server Components instead._ The plan was written, then nothing landed.
The anti-pattern (useEffect → server action) is inherited by every fork
of this template.

This advisor plan does two things:

1. **Spike** — verify the original plan's findings are still accurate at
   commit `6358b2b2`. The codebase has churned 4 months; some of these
   components may have been migrated, refactored, or removed.
2. **Execute** the remaining items as Server Components / API routes (per
   the Next.js convention).

## Current state

`REFACTOR_SERVER_ACTIONS_PLAN.md` is your input. Read it cold.

For each of the five components, the typical bad shape (per the original
plan) is:

```tsx
"use client";
useEffect(() => {
  someServerAction().then(setData);
}, []);
```

The right shape is one of:

- **Server Component** — fetch in the parent RSC, pass as prop. Best when the surrounding component is otherwise server-renderable.
- **API route + SWR/React Query** — when the data needs client-side revalidation (e.g. status polling). Server actions are for _mutations_, not reads.

## Commands you will need

| Purpose   | Command                                                    | Expected         |
| --------- | ---------------------------------------------------------- | ---------------- |
| Inventory | `grep -rn "useEffect.*Action\\b" src/components/ src/app/` | list of suspects |
| Typecheck | `bun run typecheck`                                        | no new errors    |
| Tests     | `bun run test`                                             | no regressions   |

## Scope

### Spike (always)

- Locate each of the five components listed in
  `REFACTOR_SERVER_ACTIONS_PLAN.md`.
- For each: confirm the bad pattern still exists at `6358b2b2`.

### Execution (conditional on spike)

**In scope:**

- The components that still have the bad pattern.
- New API routes if any component genuinely needs client-side fetching for revalidation reasons.

**Out of scope:**

- Components not in the original five (unless the inventory grep turns up egregious cases — document them as follow-up, don't bundle).
- Server actions used for _mutations_ (those are correctly server actions).
- The auth flow, the CMS catch-all, anything not on the original list.
- Tests for components that don't already have tests — don't tax this plan with test backfill.

## Git workflow

- Branch: `advisor/016-server-actions-cleanup`
- One commit per component refactored: `refactor(component): replace server-action-as-reader with <approach>`
- Or one big commit if the diffs are small.

## Steps

### Step 1: Read the original plan

Open `REFACTOR_SERVER_ACTIONS_PLAN.md`. List the five components and the
specific server actions each calls.

### Step 2: Verify each still has the bad pattern

For each of the five files (resolve full paths via
`find src -name "<filename>"`):

```
grep -nC3 "useEffect" <path>
```

For each, you'll see one of three states:

- **A (still broken):** useEffect → server action present. Mark for execution.
- **B (already fixed):** different pattern. Mark RESOLVED, move on.
- **C (deleted):** file no longer exists. Mark RESOLVED, note in PR.

### Step 3: Branch decision

- **If all 5 are state B/C:** Retire the original plan. Move
  `REFACTOR_SERVER_ACTIONS_PLAN.md` to `docs/archive/` (per plan 012),
  add a one-line note: "Resolved at commit \<sha\>; no remaining
  consumers." Mark plan 016 as REJECTED (with rationale) in
  `plans/README.md` and STOP.
- **If any are state A:** continue to Step 4.

### Step 4: Refactor each state-A component

For each:

1. **Decide approach.** Read the component cold:
   - Is the surrounding component otherwise a Server Component? Convert
     to Server Component, fetch data in the parent, pass as prop.
   - Does the data need client-side revalidation (polling, on-focus
     refresh, optimistic updates)? Create an API route at
     `src/app/(app)/api/<feature>/route.ts` that returns JSON; use the
     client component with `useSWR`/`useQuery` (whatever the rest of the
     codebase uses — search for examples).
2. **Implement.** Keep the change scoped to the one component + its
   parent + the new API route (if used).
3. **Verify.** The component renders correctly; the server action is no
   longer called.
4. **Smoke test.** `bun dev`, open the page that uses the component, verify
   the data appears.

### Step 5: Run typecheck and tests

`bun run typecheck && bun run test`

### Step 6: Update CLAUDE.md if needed

CLAUDE.md already states the rule. No update needed if the rule is clear.
If you find while refactoring that the codebase has multiple correct
patterns (e.g. inconsistent SWR vs React Query usage), note that as a
follow-up improvement, not part of this plan.

### Step 7: Retire the original plan doc

Once execution is done, move `REFACTOR_SERVER_ACTIONS_PLAN.md` to
`docs/archive/` with a "Completed at commit \<sha\>" note. This action
overlaps with plan 012; if plan 012 already moved it, just confirm.

## Test plan

- For each refactored component: a manual smoke test (render the page).
- If a component had a test before, keep it green.
- No new tests required; this is a refactor along a clean boundary.

## Done criteria

- [ ] Each of the five original components is in state B/C (fixed or gone).
- [ ] `grep -rn "useEffect" src/components/ src/app/ | grep -i "action\\|fetch" | wc -l` — count is no greater than before (track baseline before starting).
- [ ] `bun run typecheck` exits 0.
- [ ] `bun run test` exits 0.
- [ ] `REFACTOR_SERVER_ACTIONS_PLAN.md` has been moved to `docs/archive/` (or noted RESOLVED).
- [ ] `plans/README.md` status row for 016 updated.

## STOP conditions

- A component's server action is intentionally a mutation-with-read return
  (e.g. "submit + return fresh state"). That's correct usage of server
  actions; don't refactor it.
- A refactor of one component requires touching ≥ 5 other files because
  of tight coupling. That's a bigger refactor than this plan budgets for;
  document the chain and propose a sub-plan.
- The component has no tests AND the refactor changes runtime behavior in
  subtle ways (e.g. caching semantics). Write a quick smoke test FIRST,
  then refactor.

## Maintenance notes

- After this lands, the codebase upholds CLAUDE.md's rule. Future PRs
  introducing the same anti-pattern should be caught in review.
- Consider adding an ESLint or codemod rule: "client component + useEffect + import from server/actions = error." Out of scope for this plan, but a follow-up improvement.
- Reviewer should scrutinize: each refactored component still renders the
  data correctly (the simplest way to break this is to drop a dependency
  in useEffect that turns into a missing prop).

## Backfill candidate for `shipkit-io/bones`

Probably yes if bones has the same components. Verify in bones after merge.
