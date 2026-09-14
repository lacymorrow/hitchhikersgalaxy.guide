# Plan 012: Retire or archive stale root planning artifacts

> **Executor instructions**: Follow this plan step by step. When done,
> update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `ls -la plan.md REFACTOR_SERVER_ACTIONS_PLAN.md validation-improvements.md audit-progress.md ai.mdx SYNC_UPSTREAM.md WORKFLOW.md 2>/dev/null`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none. (Soft dep: plan 016 — if you complete the
  server-actions refactor described in `REFACTOR_SERVER_ACTIONS_PLAN.md`,
  that doc can be retired by that PR; otherwise this plan archives it.)
- **Category**: docs / tech-debt
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/233

## Why this matters

Seven (or so) markdown files at the repo root are mid-flight or completed
planning artifacts:

| File                              | Last touched | Status                                                                                                         |
| --------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------- |
| `plan.md`                         | 2026-02-15   | "Refactor & Optimization Plan (Console Debug Instrumentation)" — Phase 0 unfinished, no follow-through commits |
| `REFACTOR_SERVER_ACTIONS_PLAN.md` | 2026-02-15   | 5 critical items listed, none addressed in `git log`                                                           |
| `validation-improvements.md`      | 2025-11-02   | Claims "Applied" — unclear if accurate                                                                         |
| `audit-progress.md`               | 2025-11-02   | Phase 2.1 in-progress, no further commits                                                                      |
| `ai.mdx`                          | 2026-03-07   | unclear purpose at root (looks like a docs page that escaped `docs/`)                                          |
| `SYNC_UPSTREAM.md`                | 2026-02-15   | Reference doc — may still be current; verify against `cli/` workflow                                           |
| `WORKFLOW.md`                     | 2026-03-17   | Reference doc — possibly current                                                                               |

The first four are clearly stale. The last three need a quick read to
classify. Stale planning docs at root mislead contributors (and other
agents) into re-executing finished work or trusting incomplete claims.

## Current state

`ls -la` showed the files above at the repo root. Their purposes:

- `plan.md` and `REFACTOR_SERVER_ACTIONS_PLAN.md` and
  `validation-improvements.md` and `audit-progress.md` are _advisory_ — they
  describe work, they don't describe how to do it currently.
- `SYNC_UPSTREAM.md` and `WORKFLOW.md` look like project SOPs — possibly
  current.
- `ai.mdx` at root has `.mdx` extension — likely belongs under
  `src/content/` or `docs/`.

`CHANGELOG.md`, `CLAUDE.md`, `LICENSE`, `README.md`, `AGENTS.md`, `GEMINI.md` stay.

## Commands you will need

| Purpose | Command                                  | Expected                                                      |
| ------- | ---------------------------------------- | ------------------------------------------------------------- |
| —       | `git log --oneline -- <file>` (per file) | judge staleness                                               |
| Move    | `git mv <file> docs/archive/<file>`      | files relocated                                               |
| Lint    | `bun run lint:prettier`                  | exit 0 (changing markdown locations may matter to lint scope) |

## Scope

**In scope:**

- `plan.md`
- `REFACTOR_SERVER_ACTIONS_PLAN.md`
- `validation-improvements.md`
- `audit-progress.md`
- `ai.mdx`
- `SYNC_UPSTREAM.md` (judgment call — see Step 3)
- `WORKFLOW.md` (judgment call — see Step 3)
- New directory: `docs/archive/` (or `docs/plans-archive/`).

**Out of scope:**

- `README.md`, `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `CHANGELOG.md`, `LICENSE`, `SECURITY-AUDIT-2026-06-03*.md` (on `origin/security` only — if it lands on `main`, also archive or move to `docs/` later).
- Any markdown under `docs/` — separate housekeeping.
- The new `plans/` directory created by this advisor — leave it.

## Git workflow

- Branch: `advisor/012-archive-stale-plans`
- One commit: `chore(docs): archive stale planning docs to docs/archive`

## Steps

### Step 1: Confirm "stale" with git log per file

For each candidate:

```
git log --oneline -5 -- <file>
```

A file that hasn't been touched in months and whose latest commit message
is "fix typo" or "wip" without follow-through is stale. A file with a
recent commit that says "update progress" is being maintained — keep.

### Step 2: Cross-reference with README and CLAUDE.md

```
grep -nE "plan\\.md|REFACTOR_SERVER_ACTIONS|validation-improvements|audit-progress|ai\\.mdx|SYNC_UPSTREAM|WORKFLOW\\.md" README.md CLAUDE.md AGENTS.md
```

If any of the candidates is _linked from_ CLAUDE.md or README, it's
load-bearing. Don't move it without also updating the reference. Two
options: update the reference to the new path, or leave the file in
place.

### Step 3: Classify and decide for each

For each file:

- **Archive** (move to `docs/archive/<file>`) if it's a stale plan or audit log.
- **Move to `docs/`** if it's evergreen reference (likely `SYNC_UPSTREAM.md`, `WORKFLOW.md`, and possibly `ai.mdx` → `docs/features/ai.mdx`).
- **Delete** only if truly dead (no informational value, no historical link). Prefer archive over delete — git history doesn't tell you what you don't know to look for.

Specifically:

- `plan.md` → `docs/archive/plan-2026-02-15.md` (rename with date so future
  archives don't collide).
- `REFACTOR_SERVER_ACTIONS_PLAN.md` → keep if plan 016 hasn't been written
  to supersede it; otherwise `docs/archive/`.
- `validation-improvements.md` → `docs/archive/validation-improvements-2025-11-02.md`.
- `audit-progress.md` → `docs/archive/audit-progress-2025-11-02.md`.
- `ai.mdx` → read the front matter; if it's a docs page, `docs/features/ai.mdx`. If it's notes, archive.
- `SYNC_UPSTREAM.md` → probably keep at root or move to `docs/sync-upstream.md` and update CLAUDE.md's reference.
- `WORKFLOW.md` → same call as `SYNC_UPSTREAM.md`.

### Step 4: Move with `git mv`, don't `mv` + commit separately

`git mv plan.md docs/archive/plan-2026-02-15.md` etc. This preserves the
file's history.

### Step 5: Update references

If Step 2 found references, update each one. Search again after the moves:

```
grep -rnE "plan\\.md|REFACTOR_SERVER_ACTIONS|validation-improvements|audit-progress|ai\\.mdx" --include="*.md" --include="*.mdx" --include="*.tsx" --include="*.ts"
```

### Step 6: Add a one-paragraph header to each archived file

At the top of each archived file, add a note:

```markdown
> **Archived 2026-06-11.** This document is preserved for historical
> reference. It was not completed and should not be treated as current
> guidance. For current planning, see `plans/`.
```

This protects future contributors who land on the file via grep.

## Test plan

No new tests. Verification:

- `ls plans/ docs/archive/` shows the moved files.
- `grep -r "plan\\.md" CLAUDE.md README.md` returns no broken references.
- `bun run lint` exits 0 (the move shouldn't disturb lint, but verify).

## Done criteria

- [ ] Each archived file has the "Archived 2026-06-11" header.
- [ ] No broken references in README.md / CLAUDE.md / AGENTS.md.
- [ ] `bun run lint` exits 0.
- [ ] `git status` is clean except for the moves.
- [ ] `plans/README.md` status row for 012 updated.

## STOP conditions

- Step 1 reveals a file is actively maintained (recent commits with
  meaningful updates) — don't archive it. Skip and document why in PR.
- A file is linked from a tool or script (not just docs). Find the link
  first, decide the move's blast radius.

## Maintenance notes

- New planning docs should live in `plans/` (this directory), one file per
  initiative, with a clear status. Root-level planning files are a smell.
- If `docs/archive/` grows over time, sub-foldering by year is fine.
- Reviewer should scrutinize: no file lost history (all moves used `git mv`); no broken links in load-bearing docs.

## Backfill candidate for `shipkit-io/bones`

Maybe — only if bones has the same orphaned planning files. Check first; if not, skip.
