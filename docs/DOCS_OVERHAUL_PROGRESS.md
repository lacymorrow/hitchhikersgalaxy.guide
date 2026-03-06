# Docs Overhaul Progress

## Phase 1: Fix the Rot (README + broken links)
- [x] README.md — fix 9 broken "details" links
- [x] README.md — fix Deploy button (bones → shipkit)
- [x] README.md — fix Documentation section links
- [x] Cross-doc broken links — verified, mostly external; fixed internal/admin-setup.md
- [x] docs/index.mdx — rewritten

## Phase 2: Rewrite docs/index.mdx
- [x] Strip marketing fluff
- [x] Accurate feature/integration grid with tables
- [x] Correct links only

## Phase 3: New/Missing Docs
- [x] docs/reference/api.mdx — API route inventory (26 routes)
- [ ] docs/reference/ui.mdx — component list (existing file looks okay)
- [x] docs/development/feature-flags.md — full flag reference (40+ flags, all categories)
- [x] docs/development/cli.mdx — CLI docs (create, sync, deploy commands)
- [x] docs/development/trpc.mdx — tRPC setup and usage

## Phase 4: Audit & Tighten Existing Docs
- [x] features/authentication.mdx — added screenshot
- [x] features/payments.mdx — verified accurate
- [x] features/database.mdx — rewritten (added commands, schema, usage)
- [x] features/ai.mdx — added demo routes reference
- [x] features/storage.mdx — rewritten (added Vercel Blob, was S3-only)
- [x] features/email.mdx — rewritten (added magic links, key files)
- [x] features/cms.mdx — verified accurate
- [x] features/visual-builder.mdx — verified accurate
- [x] features/waitlist.mdx — verified accurate
- [x] features/ui.mdx — rewritten (components, theming, slots)
- [x] integrations/analytics/posthog.mdx — normalized to terse style

## Phase 5: CLAUDE.md / GEMINI.md Sync
- [x] Fixed env section (NEXTAUTH_SECRET→AUTH_SECRET, APP_SECRET, auto-enable note)
- [x] Commands verified against package.json

## Phase 6: Getting Started Flow
- [x] getting-started/index.mdx — fixed bones→shipkit URLs
- [x] getting-started/deploy.mdx — rewritten, trimmed fluff
- [x] getting-started/environment.mdx — verified complete
- [x] getting-started/file-structure.mdx — verified accurate
- [x] getting-started/setup-wizard.mdx — added screenshot

## Phase 7: Screenshots
- [x] Setup wizard (from local dev)
- [x] Homepage (from shipkit.io)
- [x] Sign-in page (from shipkit.io)
- [x] Features/pricing comparison (from shipkit.io)
- [x] 404 page (from shipkit.io)
- [ ] Dashboard (needs DB — skipped)
- [ ] Payload CMS admin (needs DB — skipped)
- [ ] Builder.io editor (needs Builder API key — skipped)

## Commits
1. `b2da7327` — docs: add overhaul plan and progress tracker
2. `9f5c48d0` — docs: phase 1+2 — fix README links, rewrite index.mdx
3. `6432dfb1` — docs: phase 3+4 — new docs, tighten existing features
4. `89a6ab4a` — docs: phase 5+6 — CLAUDE.md env section fix, getting-started cleanup
5. (pending) — docs: phase 7 — screenshots + image embeds

## Remaining
- Dashboard, Payload admin, Builder.io screenshots need DB/API keys to capture
- Could add these later when a configured environment is available
