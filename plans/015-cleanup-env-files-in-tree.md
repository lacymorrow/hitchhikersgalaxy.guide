# Plan 015: Remove stale `.env.old` / `.env.local.disabled` from the working tree

> **Executor instructions**: Follow this plan step by step. Read each file
> first to confirm contents are not still needed. When done, update the
> status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (operational hygiene)
- **Depends on**: none.
- **Category**: dx / operational hygiene
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/236

## Why this matters

`ls -la` showed these files in the repo's working tree:

- `.env.old`
- `.env.local.disabled`
- `.env.prod`
- `.env.vercel`

`git ls-files | grep env` confirms only `.env.example` is _tracked_ — none
of the above are in the git index. They are local-only files. However:

- They're stage-able. A careless `git add -A` would stage them.
- They might contain secrets (likely do; that's why they were rotated/disabled).
- Their presence at the root signals to other contributors that "rotated
  configs live here, look for clues" — that's the wrong norm.

This is operator hygiene, not a security incident: nothing leaked to git.
The fix is to delete them, document the convention, and rotate any
credentials they contain if they haven't already been rotated.

## Current state

```
$ ls -la | grep -E "^-.*\.env"
.env             (current, used by dev — keep)
.env.example     (tracked template — keep)
.env.local.disabled  (delete after audit)
.env.old             (delete after audit)
.env.prod            (delete after audit, or move under a secrets manager)
.env.vercel          (delete after audit — Vercel pulls env from the dashboard)
```

`.gitignore` already includes `.env*` patterns (verify), so these aren't
at risk of being committed by `git add`, but they CAN be added explicitly.

## Commands you will need

| Purpose          | Command                                                 | Expected            |
| ---------------- | ------------------------------------------------------- | ------------------- |
| Inspect          | `cat .env.old` etc.                                     | text content        |
| Verify untracked | `git ls-files \| grep env`                              | only `.env.example` |
| Delete           | `rm .env.old .env.local.disabled .env.prod .env.vercel` | files gone          |

## Scope

**In scope:**

- `.env.old`, `.env.local.disabled`, `.env.prod`, `.env.vercel` — read, then delete from working tree.
- `.gitignore` — confirm it already excludes `.env*` (and if not, add).
- A one-paragraph note in CLAUDE.md about the convention.

**Out of scope:**

- `.env` — the actively-used local env. Keep.
- `.env.example` — tracked template. Keep.
- Secret rotation procedures (separate operator task).
- Any other env-related files in subdirectories (`.env.local` in `cli/`, etc.) — different scope.

## Git workflow

- This change is operator-local: deleting files in your working tree does
  not produce a commit (the files weren't tracked). The branch-and-commit
  step is only for the optional CLAUDE.md doc change.
- Branch (optional): `advisor/015-env-file-hygiene`
- Optional commit: `docs(claude-md): document env-file hygiene convention`

## Steps

### Step 1: Verify nothing is tracked

```
git ls-files | grep -i env
```

Expected: only `.env.example`. If anything else appears, **STOP** —
something is tracked that shouldn't be, and this plan's premise is wrong.
Plan a `git rm --cached` + secret rotation flow instead.

### Step 2: Read each file before deleting

Skim each:

- `cat .env.old`
- `cat .env.local.disabled`
- `cat .env.prod`
- `cat .env.vercel`

If you find **active production secrets** (keys that would still grant
access if leaked), **STOP** and rotate them first via the upstream
provider's dashboard. The deletion is fine, but the keys in those files
should be invalidated regardless.

If they contain stale/rotated credentials only, deletion is fine; you're
removing clutter, not changing the security posture.

Do NOT paste file contents into the PR description, the plan, or
anywhere else. Reference filenames only.

### Step 3: Confirm `.gitignore` covers them

`cat .gitignore | grep -E "^\\.env"`

Expected: a line like `.env*` or specific entries. If `.env*` is present,
all four files are already ignored — deletion alone is sufficient.

If `.gitignore` doesn't cover them, ADD one line: `.env*` (and verify
`.env.example` is force-included via a `!.env.example` line, or the rule
is more specific).

### Step 4: Delete

```
rm .env.old .env.local.disabled .env.prod .env.vercel
```

`git status` should be clean (these were untracked).

### Step 5: Add a one-paragraph note in CLAUDE.md

In the "Environment Configuration" section of `/Users/lacy/repo/shipkit/CLAUDE.md`:

```markdown
### Env file hygiene

The only tracked env file is `.env.example` (the template). Local `.env`
is gitignored and personal. Do NOT keep `.env.old`, `.env.local.disabled`,
`.env.prod`, etc. in the working tree — rotate secrets in your provider
dashboard and delete the file. Vercel deployments pull env from the
dashboard, not from `.env.vercel`.
```

Commit this if you want a paper trail; otherwise leave the operator to
add it later.

## Test plan

No tests. Verification:

- `ls -la | grep env.old` returns nothing.
- `git ls-files | grep env` returns only `.env.example`.
- `bun dev` still starts (local `.env` is intact).

## Done criteria

- [ ] `ls -la` does not list `.env.old`, `.env.local.disabled`, `.env.prod`, or `.env.vercel`.
- [ ] `git ls-files | grep env` returns only `.env.example`.
- [ ] `.gitignore` covers all `.env*` except `.env.example`.
- [ ] CLAUDE.md note added (optional commit).
- [ ] `plans/README.md` status row for 015 updated.

## STOP conditions

- Step 1 reveals tracked env files. Pivot to a `git rm --cached` + key
  rotation plan and report.
- Step 2 reveals active production secrets in any of these files. Rotate
  before deleting.
- A file is referenced by a script or tool (`grep -rn "\.env\\.prod" .`).
  Update the reference before deleting.

## Maintenance notes

- Once this is done, future env churn lives in:
  - `.env` (local, gitignored, your personal copy).
  - Provider dashboards (Vercel, Stripe, etc.).
  - `.env.example` (tracked template; update when you add a new var).
- Reviewer scope is minimal — this is a hygiene fix.

## Backfill candidate for `shipkit-io/bones`

Probably yes if bones has the same orphaned files. Check first.
