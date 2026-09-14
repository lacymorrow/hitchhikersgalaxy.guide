# Plan 013: Replace `npm run` / `npx` in `package.json` scripts with `bun run` / `bunx`

> **Executor instructions**: Follow this plan step by step. When done,
> update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- package.json`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none.
- **Category**: dx
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/234

## Why this matters

CLAUDE.md (workspace + repo) declares Bun as THE package manager for
shipkit. `package.json` scripts contradict this by chaining `npm run` and
calling `npx` directly. This creates two real problems:

1. **Environmental surprises.** `bun run lint` shells to `npm run lint:biome`. If a dev / CI runner doesn't have `npm` installed, the supposedly Bun-native command fails.
2. **Lockfile drift risk.** `npx` may resolve a tool from a different cache than `bun`'s. Tools that read lockfiles (e.g. Drizzle Kit, `next`) may see inconsistent state.

Bun is a drop-in for both `npm run` and `npx` (the latter as `bunx`). The
fix is a sed-pass with care for postinstall edge cases.

## Current state

The offending lines in `package.json` scripts include (verify with grep):

```
grep -nE "\"[^\"]+\":\\s*\"[^\"]*\\b(npm run|npx)\\b" package.json
```

Approximate locations (verify in live file at commit `6358b2b2`):

- `"clean"` — `rm next-env.d.ts ; rm package-lock.json ; …`
- `"doctor"` — chained `npm run` invocations
- `"lint"` — chains `npm run lint:biome && npm run lint:eslint && npm run lint:prettier`
- `"lint:fix"` — chains `npm run lint:fix:biome && npm run lint:fix:eslint && npm run format`
- `"db:reset"` — chains `npm run db:drop && npm run db:generate && npm run db:migrate && npm run db:push`
- `"postinstall"` — runs `npx next telemetry disable`
- `"check:metadata"` — runs `npx check-site-meta 3000`
- `"check:performance"` — `next dev & npx react-scan@latest localhost:3000`
- `"build:registry"` — runs `npx shadcn build`
- `"analyze*"` — uses `cross-env` directly (good — no change needed)

Plus a `clean` script that deletes `bun.lockb` (legacy). Worth flagging in
Step 4.

## Commands you will need

| Purpose                   | Command                                                        | Expected    |
| ------------------------- | -------------------------------------------------------------- | ----------- |
| —                         | `cat package.json`                                             | read        |
| Test the affected scripts | `bun run lint`, `bun run db:reset` (if safe), `bun run doctor` | exit 0 each |
| Lint                      | `bun run lint:prettier -- package.json`                        | exit 0      |

## Scope

**In scope:**

- `package.json` `scripts` block.

**Out of scope:**

- The `cli/` subdirectory's own `package.json` (separate scope; plan 018 may touch it).
- Migration to `bun --bun` flags or any deeper Bun-specific feature.
- CI configuration (`.github/workflows/*`) — if those use `npm run …`, that's a follow-up.

## Git workflow

- Branch: `advisor/013-scripts-bun`
- One commit: `chore(scripts): use bun run / bunx instead of npm run / npx`

## Steps

### Step 1: Enumerate the changes

`grep -nE "npm run|npx" package.json`

Record every line. Decide per-line:

- **`npm run X`** → `bun run X` (always safe).
- **`npx tool`** → `bunx tool` (almost always safe; Bun resolves binaries the same way npx does).
- **`npx tool@version`** → `bunx tool@version` (works).

### Step 2: Special case — `postinstall`

`"postinstall": "node scripts/prebuild-content.mjs && npx next telemetry disable"`

The `postinstall` hook runs immediately after install. If a fork user runs
`npm install` (because they haven't installed Bun), having `bunx` here
makes the postinstall fail. Two options:

- **Option A (safer for downstream forks):** Leave `npx next telemetry disable` in `postinstall`. The Bun convention applies inside scripts run by developers, not the install-time hook.
- **Option B (consistent):** Change to `bunx next telemetry disable` and document in README that Bun is required.

Pick A unless the project's stance is "Bun required for any operation."
This template ships to forks, so A is conservative and correct.

### Step 3: Apply the changes

Edit `package.json`. Replace `npm run` → `bun run` and `npx` → `bunx`
everywhere except the `postinstall` (per Step 2 decision). Be careful with
chained commands — `&&` is unchanged, only the prefixes change.

The `clean` script deletes `bun.lockb` (a legacy Bun lockfile format —
modern Bun uses `bun.lock`). Update it to also delete the new lockfile if
desired, but DO NOT add the running `bun.lock` to the delete list of a
normal `clean` — only if you really mean a hard reset. Leave it as-is or
make a separate `clean:hard` script.

### Step 4: Run each script that doesn't have side effects

Test that the changes work. Skip db-mutating ones unless you have a throwaway DB.

```
bun run lint               # full lint chain
bun run doctor             # type generation + import map (may take a minute)
bun run check:metadata     # external call; fine to run
bun run build:registry     # shadcn build; produces files in public/r/
```

Verify each exits 0. Spot any that fail because the underlying tool isn't
in node_modules (rare with Bun's bin resolution, but possible).

### Step 5: Verify nothing else regresses

`bun run typecheck && bun run test`

## Test plan

No new tests. Verification by running the affected scripts (Step 4).

## Done criteria

- [ ] `grep -nE "npm run|npx" package.json` returns only the `postinstall` line (if Option A) or nothing (if Option B).
- [ ] `bun run lint` exits 0.
- [ ] `bun run doctor` exits 0.
- [ ] `bun run check:metadata` exits 0 (or, if the script requires a running dev server, skip and note).
- [ ] `bun run build:registry` exits 0.
- [ ] `bun run typecheck && bun run test` exit 0.
- [ ] `plans/README.md` status row for 013 updated.

## STOP conditions

- A script that uses `npx` does NOT resolve via `bunx` because of a
  hard-coded npm cache path or a transitive dependency. Inspect the failure
  output; usually the fix is a `bunx --bun <tool>` shape or installing the
  tool as a direct devDependency.
- The CI uses `npm` exclusively for the install step (check
  `.github/workflows/*.yml`). The build then breaks because `bun.lock` is
  out of sync. Don't fight it; either change CI to use `bun install`, or
  keep the npm-friendly scripts and document.

## Maintenance notes

- Add a one-line note in CLAUDE.md if not present: _Scripts should use `bun run` / `bunx`. The one exception is `postinstall`, which keeps `npx` to support fork users on `npm install`._
- Future scripts: same convention.
- Reviewer should scrutinize: chained `&&` ordering preserved; no script silently dropped.

## Backfill candidate for `shipkit-io/bones`

Yes if bones' scripts have the same drift; check first.
