# Plan 017: Direction — document the shadcn component registry as a distribution channel

> **Executor instructions**: Follow this plan step by step. When done,
> update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none.
- **Category**: direction (docs/distribution)
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/238
- **Shipkit-only:** this plan does NOT backfill to bones. The registry is the premium distribution channel.

## Why this matters

Shipkit ships a shadcn-style registry:

- `registry.json` at the repo root (40+ component entries).
- `bun run build:registry` produces JSON bundles in `public/r/`.
- `public/r/` already contains ~35 pre-built JSON files (`admin.json`,
  `ai.json`, `dashboard.json`, etc.).

This is a real, working distribution channel. Forks of shipkit could
`npx shadcn add @shipkit/admin` to install whole bundles. But:

- README does not mention it.
- `docs/features/registry.mdx` exists (CLAUDE.md mentions it) — verify if
  it's accurate and discoverable.
- No fork is going to find this without being told.

For a premium framework whose value prop is "high-quality components
pre-bundled and ready to install," the registry is the lever. This plan
makes it discoverable.

This is a docs + integration plan, not a code-change plan.

## Current state

- `registry.json` (root): structured per shadcn's schema.
- `public/r/*.json`: pre-built bundles.
- `bun run build:registry` invokes `npx shadcn build` (note: see plan 013;
  if executed, this becomes `bunx shadcn build`).
- `docs/features/registry.mdx`: existence and currency unknown; read first.

## Commands you will need

| Purpose        | Command                                               | Expected                 |
| -------------- | ----------------------------------------------------- | ------------------------ |
| Build registry | `bun run build:registry`                              | populates public/r       |
| Test usage     | (in a throwaway dir) `npx shadcn add <url-to-bundle>` | bundle adds successfully |

## Scope

**In scope:**

- A new docs page or update to `docs/features/registry.mdx`: how to use, what's in each bundle, how it interacts with the rest of shipkit.
- One section in `README.md` under "Features" or "Getting Started" pointing to the registry docs.
- A small section in CLAUDE.md (the workspace one or the shipkit one) noting the registry as a distribution channel.
- (Optional) a sample `npx shadcn add` command verifying a bundle works end-to-end.

**Out of scope:**

- Adding new components to the registry (separate effort).
- Refactoring `registry.json` schema.
- Publishing the registry as a hosted service or npm package (a bigger
  follow-up; this plan only documents the current self-hosted setup).
- Marketing copy / sales pages — that's outside an engineering plan.

## Git workflow

- Branch: `advisor/017-registry-docs`
- One commit: `docs(registry): document component registry as a distribution channel`

## Steps

### Step 1: Read what exists

```
cat docs/features/registry.mdx  # if it exists
cat registry.json | head -50    # understand the bundle shapes
ls public/r/                    # which bundles ship
```

Form a one-paragraph summary of the registry's current state.

### Step 2: Verify the registry build is sound

```
bun run build:registry
ls public/r/
```

Confirm clean output. If `npx shadcn build` errors (e.g., schema
mismatch with newer shadcn versions), **STOP** — the docs would be
documenting a broken feature. Fix the build first as a separate small
plan, then come back.

### Step 3: Write or update `docs/features/registry.mdx`

Content outline:

1. **Introduction.** What the registry is (a shadcn-compatible component
   bundle catalog). Who it's for (forks of shipkit, sites that want to
   compose UI from shipkit's pre-built components).
2. **Available bundles.** Table or list of each `public/r/<name>.json`
   with a one-line description. Generate this list from
   `registry.json` — if there's an authoritative description per entry,
   surface it.
3. **How to install a bundle.** Concrete example: `npx shadcn add
https://shipkit.io/r/admin.json` (or whatever the deployed URL
   pattern is). If the URL is uncertain, document the locally-served
   shape: `npx shadcn add http://localhost:3000/r/admin.json`.
4. **Dependencies and assumptions.** Some bundles assume specific
   Tailwind / shadcn versions; call them out. (Or note "tested against
   shadcn X.Y.")
5. **How to add a new bundle (for shipkit maintainers).** Edit
   `registry.json`, run `bun run build:registry`, deploy. One paragraph.
6. **Premium / free distinction.** Per project memory, the registry is the
   premium distribution channel and not backfilled to bones. State this so
   forks understand what they're getting.

### Step 4: Add a README section

In `README.md`, add a short section pointing at the registry docs. Two
or three sentences plus a code example. Don't repeat all of the docs —
this is a wayfinder.

### Step 5: Add a CLAUDE.md note

A one-line addition to the "Registry" section of CLAUDE.md:
_Registry bundles are the premium distribution channel — see
`docs/features/registry.mdx` for the catalog and integration steps._

### Step 6: End-to-end smoke test (manual)

In a throwaway directory (NOT this repo):

1. `npx create-next-app@latest test-app`
2. `cd test-app && npx shadcn init`
3. `npx shadcn add http://localhost:3000/r/admin.json` (with `bun dev` running in shipkit).
4. Confirm the admin bundle installs.

This is optional but recommended: it validates the docs are not just
plausible.

## Test plan

No new automated tests (docs).

Verification:

- `bun run build:registry` succeeds.
- Step 6 smoke test (if performed) succeeds.

## Done criteria

- [ ] `docs/features/registry.mdx` exists and covers the six-point outline above.
- [ ] `README.md` has a section linking to the registry docs.
- [ ] CLAUDE.md has the one-line note.
- [ ] `bun run build:registry` exits 0.
- [ ] `plans/README.md` status row for 017 updated.

## STOP conditions

- `bun run build:registry` errors. Fix the build first.
- `docs/features/registry.mdx` already exists and is current — then this
  plan is downscoped to "verify README link exists and is accurate."

## Maintenance notes

- When you add a new bundle to `registry.json`, update the docs table.
- If shadcn's registry schema changes (major version), update the
  `build:registry` command and docs at the same time.
- Reviewer should scrutinize: the install URL in docs matches the actual
  deployment URL of `public/r/*.json`; the premium/free distinction is
  documented.

## Backfill candidate for `shipkit-io/bones`

No — registry is shipkit-only by project policy.
