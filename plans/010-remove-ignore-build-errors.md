# Plan 010: Remove `typescript.ignoreBuildErrors: true` from `next.config.ts`

> **Executor instructions**: Follow this plan step by step. If anything in
> the "STOP conditions" section occurs, stop and report. When done, update
> the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- next.config.ts tsconfig.json`

## Status

- **Priority**: P2
- **Effort**: M (depends on how many errors surface)
- **Risk**: MED (some errors may be hiding real bugs)
- **Depends on**: none.
- **Category**: dx / correctness
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/231
- This finding was flagged as "M7" in `SECURITY-AUDIT-2026-06-03.md` and
  deferred there with the note "flipping this surfaces latent type errors;
  that's a separate triage session, not a security pass." This plan IS that
  triage session.

## Why this matters

```ts
// next.config.ts:183-189
typescript: {
  // !! WARN !!
  // Dangerously allow production builds to successfully complete even if
  // your project has type errors.
  // !! WARN !!
  ignoreBuildErrors: true,
},
```

What this means in practice:

- `bun run build` silently green even when types broke.
- Downstream forks inherit a template that builds despite type errors —
  bad signal hygiene becomes the default.
- Type errors mask real bugs (the security audit flagged this as a class:
  "session-undefined and `any`-propagation bugs that mask auth holes").

Fixing requires (a) seeing the current error count, (b) classifying each,
(c) fixing or suppressing with explicit `// @ts-expect-error <reason>`,
(d) flipping the flag.

## Current state

- `next.config.ts:189` — `ignoreBuildErrors: true`.
- `bun run typecheck` runs `tsc --noEmit` (per package.json) — that's the
  source of truth for current error state, _independent_ of the
  build-time flag. The flag only affects `next build`.

Before starting, capture a baseline:

```
bun run typecheck > /tmp/typecheck-baseline.txt 2>&1 || true
grep -c "error TS" /tmp/typecheck-baseline.txt   # how many errors today
```

There may be zero (the project just happens to typecheck fine and the flag
is paranoia), or there may be hundreds. The plan branches on the count.

## Commands you will need

| Purpose   | Command                                | Expected                      |
| --------- | -------------------------------------- | ----------------------------- |
| Typecheck | `bun run typecheck`                    | targets exit 0 by end         |
| Build     | `bun run build`                        | exits 0 with the flag flipped |
| Lint      | `bun run lint:biome -- next.config.ts` | exit 0                        |

## Scope

**In scope:**

- `next.config.ts` — set `ignoreBuildErrors: false`.
- Whatever individual files have type errors — fix or annotate with a
  scoped `// @ts-expect-error: <reason>` comment.

**Out of scope:**

- The parallel `eslint.ignoreDuringBuilds` flag (if it exists in the
  config) — separate concern; only address if it's also set to `true` and
  you have spare cycles.
- `tsconfig.json` strictness changes (`strict`, `noUncheckedIndexedAccess`,
  etc.). The codebase has separate `tsconfig.strict.json` and
  `tsconfig.disabled.json`; cleaning those up is a different plan.
- Migrating `any` to typed in places that pass typecheck today.

## Git workflow

- Branch: `advisor/010-typecheck-build-gate`
- Two commits if useful:
  - `chore(types): fix type errors surfaced by re-enabling ignoreBuildErrors`
  - `chore(build): remove next.config.ts ignoreBuildErrors flag`

## Steps

### Step 1: Capture baseline

```
bun run typecheck 2>&1 | tee /tmp/typecheck.log
grep -E "error TS[0-9]+" /tmp/typecheck.log | wc -l   # total error count
grep -E "error TS[0-9]+" /tmp/typecheck.log | awk '{print $NF}' | sort | uniq -c | sort -rn | head  # error codes
```

Branch on the count:

- **0 errors** → jump to Step 5. The flag is paranoia; flip it.
- **1–30 errors** → fix them all (Steps 2–4).
- **>30 errors** → STOP. Report the count and the top error codes; the
  operator decides whether to budget the fix-up. The plan is correct in
  spirit but the scope is unknown.

### Step 2: Triage errors by category

Group the errors by error code (`TS2xxx`, `TS7xxx`, etc.). For each group,
note whether they're:

- **Real bugs.** Fix the code. (E.g. a property accessed on `undefined`,
  a missing return type that hides a bug.)
- **Unsafe but currently working.** Tighten the type or add a guard.
- **Genuinely safe and noisy.** Annotate with `// @ts-expect-error: <reason>`
  on the offending line. Always include a reason; "ts won't infer foo
  through bar's overloads" is fine. Never use `// @ts-ignore` (a
  `@ts-expect-error` errors if the line stops having an error, so it
  rots gracefully).

Take this in passes: fix one error category at a time, re-run typecheck,
move on.

### Step 3: For tricky errors, add helpers, not casts

If a chunk of errors comes from `any` in third-party types (e.g. Payload's
generic find shape), prefer adding a typed helper at a boundary over
casting throughout. Casts spread; helpers contain.

### Step 4: Re-run typecheck until 0

`bun run typecheck` must exit 0. If there are remaining errors you
explicitly annotated with `// @ts-expect-error`, each must have a reason
comment, and `bun run typecheck` still exits 0.

### Step 5: Flip the flag

In `next.config.ts`, replace the typescript block:

```ts
typescript: {
  ignoreBuildErrors: false,
},
```

Or remove it entirely (false is the default).

Also remove the `// !! WARN !!` comments around it (they were warning
about the now-removed setting).

### Step 6: Confirm `next build` works

`bun run build`

This catches errors `tsc --noEmit` doesn't (Next.js has its own
type-check layer). Fix any new errors that surface.

If `bun run build:vercel` is the production-equivalent build:
`bun run build:vercel`.

### Step 7: Update CLAUDE.md / CI gates

If `bun run lint` / `bun run typecheck` / `bun run build` are mentioned in
CLAUDE.md or CI configs as required gates, confirm they're aligned. If
typecheck is documented as "required before commit," that's now true at
build time too — call it out in the PR description.

## Test plan

No new application tests. The change is verified by:

1. `bun run typecheck` exits 0.
2. `bun run build` exits 0 with the flag flipped.
3. `bun run test` exits 0 — no regressions.

## Done criteria

- [ ] `grep -n "ignoreBuildErrors" next.config.ts` returns no match (or shows `false`).
- [ ] `bun run typecheck` exits 0.
- [ ] `bun run build` exits 0.
- [ ] `bun run test` exits 0.
- [ ] All `@ts-expect-error` annotations added in this PR carry a one-line reason comment.
- [ ] `plans/README.md` status row for 010 updated.

## STOP conditions

- Baseline error count is > 30 — the plan's scope is unknown. Report and
  let the operator carve up the work.
- A single error is in generated code (e.g. Payload's generated types in a
  `.payload-types.ts` or a `next-env.d.ts`). Fix at the source (the
  generator config, or regenerate); don't patch generated files by hand.
- An error chain crosses 5+ files where each fix forces another fix
  elsewhere. That's a sign of a deeper missing type alias or generic; STOP
  and propose introducing one before continuing.

## Maintenance notes

- After this lands, the build is now a _real_ type gate. Any new code that
  breaks typecheck breaks the build — that's the goal. Update CI to fail
  loudly on type errors (most likely already does, but verify).
- Future template forks inherit a clean type baseline.
- Reviewer should scrutinize: every `@ts-expect-error` has a reason; no
  legitimate bugs were swept under a `@ts-expect-error` carpet.

## Backfill candidate for `shipkit-io/bones`

Yes — bones almost certainly has the same flag. Backfill the flag flip;
type fixes may differ if the code base diverges.
