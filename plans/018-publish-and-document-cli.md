# Plan 018: Direction — publish the `cli/` scaffolder and link it from README

> **Executor instructions**: Follow this plan step by step. If anything in
> the "STOP conditions" section occurs, stop and report. When done, update
> the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED (publishing a new package introduces operational obligations)
- **Depends on**: none.
- **Category**: direction (distribution / DX)
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/239
- **Shipkit-only:** the CLI is the premium scaffolder. Not backfilled to bones.

## Why this matters

Shipkit's `cli/` directory implements a working scaffolder:

- Binaries: `shipkit` and `create-shipkit` (per `cli/package.json`).
- Built with Commander + `@clack/prompts`.
- Commands: `create`, `sync`, `deploy` (per CLAUDE.md).
- Local builds and runs fine (`bun run build && node dist/index.js create my-new-site`).

But:

- It is **not published to npm** (verify in Step 1 — if it is, scope shrinks).
- README does **not** mention it.
- Forks scaffold manually instead of running `npx create-shipkit my-site`.

For a template-style premium framework, the CLI is the primary onboarding
funnel. Publishing it + linking it from README is the highest-leverage
direction win in this audit.

## Current state

- `cli/` directory exists; `cli/package.json` declares binaries.
- `cli/dist/index.js` is the build output.
- CLAUDE.md documents the CLI commands (line 256–266 of the shipkit CLAUDE.md).
- `git log -- cli/` shows recent commits indicating active maintenance.

Verify in Step 1: is `create-shipkit` (or `shipkit`) already published on
npm?

## Commands you will need

| Purpose                              | Command                                                          | Expected                    |
| ------------------------------------ | ---------------------------------------------------------------- | --------------------------- |
| Check npm                            | `npm view create-shipkit version` and `npm view shipkit version` | exit code reveals existence |
| Build CLI                            | `cd cli && bun install && bun run build`                         | `dist/index.js` exists      |
| Smoke test                           | `node cli/dist/index.js create my-test-site --yes` (in `/tmp`)   | scaffolds successfully      |
| Publish (DO NOT RUN unless approved) | `cd cli && npm publish --access public`                          | published                   |

## Scope

**In scope:**

- `cli/package.json` — confirm/update `name`, `version`, `bin`, `files`, `publishConfig`.
- `cli/README.md` — write one if missing; updated example invocations.
- `README.md` (root) — add a "Quick start" section pointing at `npx create-shipkit my-site`.
- A short CI workflow (`.github/workflows/cli-publish.yml`) to publish on tag (optional, recommended).
- Smoke test script (manual or scripted) confirming the CLI works.

**Out of scope:**

- New CLI commands or features.
- The CLI's UX or interactivity overhaul.
- Replacing the build chain (esbuild / tsup / whatever) — only touch if broken.
- Backporting to bones.

## Git workflow

- Branch: `advisor/018-cli-publish`
- Multiple commits:
  - `chore(cli): prepare package.json for first publish`
  - `docs(cli,readme): document CLI scaffolding and link from root README`
  - `ci(cli): add publish-on-tag workflow`

## Steps

### Step 1: Check current npm state

```
npm view create-shipkit version 2>&1 || echo "not published"
npm view shipkit version 2>&1 || echo "not published"
```

Three states:

- **Both unpublished:** proceed with publish (Step 2+).
- **One published, current:** scope shrinks to README + smoke test (skip Steps 3–4).
- **Squatted by someone else:** pick a different name (`@shipkit/cli` scoped, or `shipkit-create`). **STOP** and report.

### Step 2: Audit `cli/package.json` for publish-readiness

Open `cli/package.json`. Required fields for a clean publish:

- `name` — `create-shipkit` (and/or `shipkit`).
- `version` — semver. Start at `0.1.0` if unpublished.
- `description` — one sentence.
- `bin` — `{ "shipkit": "./dist/index.js", "create-shipkit": "./dist/index.js" }`.
- `files` — `["dist", "README.md"]` (NOT `src/` — keep the package lean).
- `repository`, `homepage`, `license`, `author` — fill in.
- `engines` — `{ "node": ">=18" }`.
- `publishConfig` — `{ "access": "public" }` if scoped.

Update missing fields. Do NOT add an `exports` map unless the CLI is also
consumed as a library (it isn't).

### Step 3: Build and verify the artifact

```
cd cli && bun install && bun run build
ls dist/
node dist/index.js --help            # CLI prints help
node dist/index.js create my-test-site --yes  # (run in /tmp; expects to scaffold a fresh repo)
```

If the build chain fails, fix it FIRST as a small separate task. The
plan's publish step depends on a working `dist/index.js`.

### Step 4: Publish (gate this behind operator approval)

**Do NOT run `npm publish` unilaterally.** This plan describes the
publish; the operator runs it after reviewing the prepared package.

If the operator confirms:

```
cd cli && npm publish --access public
```

For initial publish of `create-shipkit`, this makes
`npx create-shipkit my-site` work globally.

### Step 5: Write `cli/README.md`

Cover:

- What it does (scaffold a new shipkit site from the template).
- Install / use: `npx create-shipkit my-site`.
- Subcommands: `create`, `sync`, `deploy` — one paragraph each.
- Local development of the CLI itself: `bun install && bun run dev`, etc.
- Releasing a new version: `npm version <patch|minor|major> && git push --follow-tags` (if you add the tag-driven workflow in Step 7).

### Step 6: Update root `README.md`

Add a "Quick start" or "Scaffold a new site" section near the top:

```markdown
## Scaffold a new site

\`\`\`
npx create-shipkit my-new-site
cd my-new-site
bun dev
\`\`\`
```

Link to `cli/README.md` for advanced usage.

### Step 7 (optional): CI workflow for publishing on tag

Create `.github/workflows/cli-publish.yml`:

```yaml
name: Publish CLI
on:
  push:
    tags:
      - "cli-v*"

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: cd cli && bun install && bun run build
      - run: cd cli && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Requires `NPM_TOKEN` in the repo secrets. Out of band: operator adds.

If you don't want CI publish yet, skip and document the manual `npm publish` flow in `cli/README.md`.

### Step 8: Smoke test end-to-end

After publish (or after a `npm pack` + local install if not yet
published):

```
cd /tmp
npx create-shipkit my-test-site
cd my-test-site
bun install
bun dev   # site should start
```

Confirm the scaffolded site works.

## Test plan

The CLI itself doesn't need a unit-test suite for this plan (it's small).
But an integration smoke test (Step 8) protects against regression.

If you want a CI job that runs the smoke test on every push to `cli/`,
that's a separate (worthwhile) follow-up.

## Done criteria

- [ ] `cli/package.json` has all required publish fields (Step 2 checklist).
- [ ] `cli/README.md` exists with install + use + commands documented.
- [ ] Root `README.md` has a "Scaffold a new site" section with the `npx create-shipkit` example.
- [ ] (If operator approved publish) `npm view create-shipkit version` returns the published version.
- [ ] (Optional) `.github/workflows/cli-publish.yml` exists.
- [ ] Step 8 smoke test produced a working scaffolded site.
- [ ] `plans/README.md` status row for 018 updated.

## STOP conditions

- The name `create-shipkit` (or `shipkit`) is squatted on npm. Pick a
  different name (`@shipkit-io/cli`, scoped) and proceed.
- The CLI's build chain doesn't produce a runnable `dist/index.js` from a
  cold `bun install && bun run build`. Fix as a precondition.
- Step 4 publish requires the operator's npm credentials. Don't paste
  them anywhere; the operator runs publish themselves.
- The CLI depends on private packages (look at `cli/package.json`
  `dependencies`). Resolve before publishing.

## Maintenance notes

- The CLI's `sync` command (graft upstream changes) is meaningful only as
  long as the upstream template stays clean. Add `cli/README.md` notes
  about when `sync` is safe.
- Future CLI features that touch user filesystems should keep paths
  contained (no surprise writes outside the target directory).
- Reviewer should scrutinize: the publish package doesn't include source
  maps that leak internal paths; the `files` field in `package.json` is
  tight; no secrets in `dist/`.

## Backfill candidate for `shipkit-io/bones`

No — CLI is shipkit-only.
