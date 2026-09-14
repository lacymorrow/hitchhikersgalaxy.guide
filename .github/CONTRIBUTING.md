# Contributing to Shipkit

Thanks for your interest. **Shipkit** is the premium Next.js framework downstream of [Shipkit Bones](https://github.com/shipkit-io/bones) — a Next.js 16 + React 19 (App Router + TypeScript) stack with Tailwind, Shadcn/UI, Drizzle ORM on PostgreSQL, Payload CMS, and integrations across auth (NextAuth + Better Auth + Payload credentials), payments (Lemon Squeezy, Stripe, Polar), email (Resend), and AI providers. Shipkit lives at [shipkit.io](https://shipkit.io).

## Quick start

Prerequisites: **Bun**, **PostgreSQL** (or a hosted Postgres URL), Node 20+.

```bash
git clone https://github.com/lacymorrow/shipkit.git
cd shipkit
bun install
cp .env.example .env       # DATABASE_URL is the minimum to boot

bun dev                    # Next dev server
bun run db:migrate         # apply migrations once .env is set
```

See [`CLAUDE.md`](../CLAUDE.md) for the architecture deep-dive: route groups, services / actions split, feature-flag system, Payload integration.

## Reporting bugs

Open an issue using the **Bug Report** template. Include the URL or page, exact reproduction steps, what you expected, what you saw, and (if relevant) which feature flags were enabled. Browser/OS only when the bug is visual or device-specific.

## Proposing changes

For non-trivial work — new routes, schema changes, auth/permission changes, new integrations — open an issue first to align on the approach. Small fixes (typos, dead links, single-file bugs) can go straight to a PR.

Because Shipkit is the upstream for a number of downstream sites (e.g., `shipkit-sink` powering shipkit.io itself, `lash-www`, `TOH-new`, and other client deployments), changes here ripple. Flag breaking changes or schema migrations explicitly in the PR description so downstream maintainers can sequence their syncs.

## Pull requests

1. Branch from `main`. Use a descriptive name (`fix/auth-redirect`, `feat/builder-page`).
2. One logical change per PR. Don't bundle refactors with feature work.
3. Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`).
4. Fill in the PR template — especially the test plan.

## Code style

- **Server Components first.** Reach for `'use client'` only when you need browser-only APIs or interactivity.
- **Server Actions for mutations**, Server Components for data fetching. Never use server actions to fetch.
- **Services layer.** Business logic lives in `src/server/services/`; mutation actions in `src/server/actions/` call services. **Server Components call services directly for data fetching.** **Client Components call actions for mutations** — never reach into services from the client.
- **Drizzle + Postgres.** Schema in `src/server/db/schema.ts`. After edits: `bun run db:generate` → `bun run db:migrate`. Prefer timestamps over booleans (`activeAt`, not `isActive`).
- **TypeScript.** Strict; no `any` without an explanatory comment. Interfaces over types; no enums (use objects/maps).
- **Naming.** kebab-case files, PascalCase components, camelCase variables. Named exports only — no default exports.
- **File size.** Keep files under 500 lines.
- **Feature flags.** Toggle features via `NEXT_PUBLIC_FEATURE_*_ENABLED` env vars. Features must degrade cleanly when disabled.

Run before pushing:

```bash
bun run lint:fix       # Biome + ESLint + Prettier auto-fix
bun run typecheck      # tsc --noEmit
bun run test           # Vitest
```

## Upstream sync

Shipkit tracks [Shipkit Bones](https://github.com/shipkit-io/bones) as its upstream. The bones version is pinned in `package.json` under the `shipkit.bones` key, and `scripts/git-sync-upstream.ts` automates the pull. If you're adding something that genuinely belongs upstream (e.g., a fix to a free feature, a new shadcn component), consider opening it against bones first so all downstream sites benefit.

## Security

Please **do not open public issues for security vulnerabilities**. See [SECURITY.md](SECURITY.md) for private disclosure.

## License

Shipkit is licensed under [FSL-1.1-MIT](../LICENSE) — the Functional Source License with an MIT future grant. Source-available, free for any Permitted Purpose (internal use, education, research, professional services), excludes Competing Use, and converts to standard MIT two years after each release. By contributing, you agree your contributions will be licensed under the same terms.
