# ShipKit Docs Overhaul Plan

## Principles

- **Terse over fluffy.** Lacy's integration docs are the gold standard: env vars, one-liner explanation, done. Feature docs can be slightly more verbose — but only when it saves the reader time.
- **No AI fluff.** No "powerful", "seamless", "comprehensive". Just what it does and how to use it.
- **Code over prose.** Show the config, the import, the command. If it can be a code block, make it a code block.
- **Link to code, not abstractions.** Reference actual file paths. They're the real docs.
- **Feature-flagged everything.** ShipKit's architecture is "enable by env var". Docs should reflect that — every feature page starts with what env vars turn it on.

---

## Phase 1: Fix the Rot (README + broken links)

**Goal:** Nothing links to a 404.

### README.md

| Problem | Fix |
|---------|-----|
| 9/10 "details" links broken | Rewrite to point to `docs/features/*.mdx` and `docs/guides/*.mdx` |
| Deploy button references `shipkit-io/bones` | Update to `shipkit-io/shipkit` (or whatever the current repo is) |
| "Documentation" section links to `docs/deployment.mdx`, `docs/development.mdx` | Fix to `docs/getting-started/deploy.mdx`, `docs/development/index.mdx` |
| Tech list says "Auth.js" only | Mention it's swappable (Better Auth, Clerk, Supabase, Stack) |
| Vercel deploy URL still has `bones` references in query params | Update all `bones` → `shipkit` |

### Cross-doc broken links (16 targets)

| Dead link | Resolution |
|-----------|------------|
| `/docs/api` | Create `docs/reference/api.mdx` (list API routes from codebase) |
| `/docs/auth` | Redirect → `/docs/features/authentication` |
| `/docs/builder` | Redirect → `/docs/features/visual-builder` |
| `/docs/payload` | Redirect → `/docs/features/cms` or `/docs/integrations/payload` |
| `/docs/ui` | Create `docs/reference/ui.mdx` (component inventory) |
| `/docs/content-management` | Redirect → `/docs/features/cms` |
| `/docs/deployment` | Redirect → `/docs/getting-started/deploy` |
| `/docs/env` | Redirect → `/docs/getting-started/environment` |
| `/docs/overview` | Redirect → `/docs/` (index) |
| `/docs/waitlist` | Redirect → `/docs/features/waitlist` |
| `/docs/snippets/api` | Fix to `docs/reference/snippets/api` |
| `/docs/snippets/components` | Fix to `docs/reference/snippets/components` |
| `/docs/templates` | Remove link or create stub |
| `/docs/claude-code` | Remove or link to `CLAUDE.md` |
| `/docs/nextjs-app-router` | Remove — external Next.js docs |
| `/docs/sql-schema-declaration` | Remove — external Drizzle docs |

**Approach:** Fix in-doc links where possible. For the 3-4 that need new pages, create them minimal. Don't create redirect files — just fix the source links.

---

## Phase 2: Rewrite docs/index.mdx

Current index is okay but has broken links and some fluff. Rewrite to be:

```
# ShipKit

Next.js 15 starter kit. Auth, payments, CMS, email, AI — all feature-flagged. Enable what you need via env vars.

## Quick Start
→ getting-started/

## Stack
- Next.js 15 (App Router)
- TypeScript + Bun
- Tailwind + Shadcn/UI
- Drizzle ORM + PostgreSQL
- Payload CMS v3

## Features
[grid/list linking to each feature doc]

## Integrations
[grid/list linking to integration docs]
```

Kill the "Non-Developers can use..." marketing copy. This is developer docs.

---

## Phase 3: New/Missing Docs

### 3a. `docs/reference/api.mdx` (NEW)

Inventory of all API routes from the codebase. Format:

```
| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| /api/payments/check-purchase | GET | Yes | Check purchase status |
| /api/docs/search | GET | No | Search documentation |
...
```

Pulled straight from `src/app/**/api/**/route.ts`.

### 3b. `docs/reference/ui.mdx` (NEW)

List of available UI components. Not full Storybook — just a categorized list with import paths. Shadcn components + custom components.

### 3c. `docs/guides/feature-flags.mdx` (REWRITE)

The existing `docs/development/feature-flags.md` needs to become THE reference for how ShipKit's feature system works. Content:

- How `features-config.ts` detects features at build time
- The `NEXT_PUBLIC_` env var mirroring system (big deal, undersold currently)
- Complete flag inventory table (auto-generate from `features-config.ts`)
- How to add a new feature flag

### 3d. `docs/development/cli.mdx` (NEW)

The `cli/` directory exists with its own build. Needs a doc:
- What it does
- How to build/use it
- Commands available

### 3e. `docs/development/trpc.mdx` (NEW — or fold into existing)

tRPC is wired up but undocumented. Short page:
- Router structure (`src/lib/trpc/`)
- How to add a new procedure
- Client usage

### 3f. `docs/guides/server-actions.mdx` (NEW)

There are ~20 server action files. Document the pattern:
- Where they live (`src/server/actions/`)
- Auth protection pattern
- Validation with schemas
- Error handling

---

## Phase 4: Audit & Tighten Existing Docs

### `docs/features/authentication.mdx`
- ✅ Accurate, well-structured
- Minor: add a note about the `NEXT_PUBLIC_` mirroring for auth env vars
- Minor: "Key Files" table references `src/server/lib/auth.ts` — verify this is the right entrypoint vs `src/server/auth.ts`

### `docs/features/payments.mdx`
- ✅ Solid
- Minor: verify the `PaymentService` method names still match code
- Add: brief note on the Polar `@polar-sh/nextjs` SDK auto-config

### `docs/features/database.mdx`
- Thin. Needs:
  - Schema file location (`src/server/db/schema.ts`)
  - Migration workflow (the `db:*` commands from CLAUDE.md)
  - Connection via `src/server/db/index.ts`
  - Payload CMS dual-schema setup (Payload has its own DB management)

### `docs/features/ai.mdx`
- Good content on SmolLM/WebGPU
- Add: the actual AI demo routes (`src/app/(app)/(demo)/`)
- Add: how `integration-service.ts` detects configured providers

### `docs/features/storage.mdx`
- 52 lines, probably thin
- Verify it covers both S3 and Vercel Blob (both are in deps)
- Reference `src/server/services/s3.ts` and `src/server/services/file.ts`

### `docs/features/email.mdx`
- 43 lines
- Should cover: Resend setup, magic link auth integration, template location
- Reference `src/server/services/resend-service.ts`

### `docs/features/cms.mdx`
- 108 lines, probably decent
- Verify Payload v3 specifics are current
- Admin panel route, collections, media handling

### `docs/features/visual-builder.mdx`
- 103 lines
- Verify Builder.io integration is current
- Reference `src/builder-registry.ts`

### `docs/features/waitlist.mdx`
- 194 lines — longest feature doc
- Probably fine, just verify accuracy

### `docs/features/ui.mdx`
- 37 lines — way too thin for "UI"
- Either beef up or merge into the new `reference/ui.mdx`

### Integration docs (Lacy's style — leave mostly alone)
- Verify env var names still match `env.ts` and `features-config.ts`
- Check that the PostHog doc isn't anomalously verbose vs the others (it is — 80 lines of "features enabled" checkmarks and production deployment checklist that don't match the terse Clerk/Stripe style)

---

## Phase 5: CLAUDE.md / GEMINI.md Sync

CLAUDE.md is the most accurate dev reference. Make sure it stays that way:
- Cross-reference its command list against `package.json` scripts
- Verify architecture overview matches current code structure
- Don't duplicate — CLAUDE.md is for AI agents, docs/ is for humans

---

## Phase 6: Getting Started Flow

The `docs/getting-started/` section should be the entry point. Verify:

| Page | Lines | Status |
|------|-------|--------|
| `index.mdx` | 67 | Check if it links correctly to sub-pages |
| `deploy.mdx` | 117 | Verify Vercel deploy flow is current |
| `environment.mdx` | 198 | THE env var reference — make sure it's complete |
| `file-structure.mdx` | 67 | Verify directory tree matches reality |
| `setup-wizard.mdx` | 46 | Verify wizard still exists and works |

---

## Execution Order

1. **Phase 1** — Fix broken links. Fastest wins, stops the bleeding.
2. **Phase 2** — Rewrite index. Sets the tone.
3. **Phase 6** — Getting started flow. First thing new users hit.
4. **Phase 4** — Tighten existing feature docs. Bulk of the work.
5. **Phase 3** — New docs (API, UI, feature flags, CLI, tRPC, server actions).
6. **Phase 5** — CLAUDE.md sync. Last because it's already the best.

---

## Phase 7: Screenshots

Take browser screenshots of key UI surfaces and embed in docs where they add value:

- Setup wizard flow
- Admin dashboard
- Auth pages (sign-in, sign-up)
- Payload CMS admin panel
- Builder.io visual editor
- DevTools panel
- AI demo (SmolLM WebGPU)
- Analytics dashboard examples
- Payment checkout flows

Screenshots go in `docs/images/` and get referenced in the relevant `.mdx` files.

---

## Style Guide (for this overhaul)

- **Headings:** `# Page Title` then `## Sections`. No deeper than `###`.
- **Env vars:** Always in a fenced code block with `bash` syntax.
- **File references:** Inline code with full path from repo root: `src/server/auth.ts`
- **Tables > lists** for structured data (providers, routes, flags).
- **No emojis in headings.** Emojis in README badges only.
- **No "Getting Started" inside feature docs.** That's what `getting-started/` is for.
- **Every feature doc starts with:** What it is (one sentence), env vars to enable it, key files.
- **Screenshots:** Include where they save the reader from guessing what a UI looks like. No decorative screenshots.

---

## Progress Tracking

Progress is tracked in `docs/DOCS_OVERHAUL_PROGRESS.md`.
