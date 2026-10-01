# Changelog

All notable changes to Shipkit are recorded here.

The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), and Shipkit follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

A note on tags, because Shipkit is a framework other sites fork from and the tag history is not clean. Only `v0.2.1` is a usable git tag. Version `0.2.2` shipped as a `package.json` bump on 2026-05-15 and was never tagged, so it has no compare link below. `v2.1.2` is left over from the monorepo era and points at the same commit as `v0.2.1`. `v2.1.1` points at a commit that is not in this repository's history at all. Pin downstream sites to a commit SHA rather than a tag.

## [Unreleased]

### Added

- The changelog page reads this file as a source. Curated markdown in `src/content/changelog/` still wins, this file comes next, and generated commit entries come last. The file is read from disk first and from the configured GitHub repo otherwise, so a downstream site publishes the changelog of whatever repo it is the website for by pointing `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME` at it. `CHANGELOG_PATH=""` opts out and `CHANGELOG_PATH` also points at a different filename.
- Docs run on pluggable providers. Fumadocs is the default and Holocron runs alongside it, so a downstream site picks a docs renderer instead of inheriting one. A link check gates merges.
- Event logging runs through `evlog` behind the `NEXT_PUBLIC_FEATURE_EVLOG_ENABLED` flag, off by default and a no-op when disabled. It drains through the existing `@vercel/otel` OTLP pipeline, so no new vendor is involved. An audit service rides along, recording tamper-evident events for entity changes (LAC-3361).
- Postgres-backed tests run against real containers through Testcontainers, and a CI workflow gates merges on typecheck, lint, unit tests, and end-to-end tests. Playwright covers login, checkout link integrity, SEO metadata, and the marketing pages.
- `bun run verify` runs the CI checks locally, plus a `next start` smoke, and prints a Markdown summary for the pull request body.
- A supply chain triage script, `bun run audit:triage`, ranks advisories by whether they reach production and whether an outsider can trigger them, instead of by severity alone. It re-checks every finding against the installed version, because `bun audit` does not and reported a Next.js 15 advisory against this Next.js 16 tree.
- In development the keyboard shortcut provider warns once, a second after mount, naming every `shortcutConfig` entry that nothing registered a handler for. A key with no handler still binds and still swallows the press, with no build, lint, or test failure anywhere.
- `gitleaks` scans run in CI and in a pre-commit hook, so a leaked credential fails the commit rather than the audit (LAC-3163).
- Dependabot groups GitHub Actions and dependency updates into batched pull requests (LAC-3319).
- JSON-LD structured data and a comparison post carry the keyword work for shipkit.io, and the landing marquee shows sites built with Shipkit.

### Changed

- **Breaking.** TypeScript moves from 5.9 to 6.0, which forces `tsconfig.json` changes. `baseUrl` is dropped, since it is deprecated and becomes a hard error in 7.0 and `paths` already resolve relative to the tsconfig. `noUncheckedSideEffectImports` is set to `false`, because the new 6.0 default flags the CSS side-effect imports. `downlevelIteration` is dropped from `tsconfig.workers.json`. A downstream site with its own tsconfig makes the same three edits. TypeScript 7 is not viable yet: it ships without the programmatic API that typescript-eslint, `next build` type checking, and Fumadocs all need.
- **Breaking.** Next.js moves to 16.3.5, which removes `experimental.viewTransition` from the config schema. A downstream site that sets it fails typecheck until the option comes out.
- **Breaking.** The Node floor rises to 22. jsdom moves from 28 to 30, `@testing-library/jest-dom` from 6 to 7, and `concurrently` from 9 to 10, and each drops Node below 22. `concurrently` is also ESM-only now. `@testing-library/dom` becomes a required peer of jest-dom, so it is declared explicitly.
- **Breaking.** `MenuItemProps.shortcut?: string` becomes `action?: ShortcutActionType`, so a menu row names a bound action rather than a hand-written key string. A downstream site passing literal shortcut text to a menu item passes the action instead, and the key renders from the config.
- Builds run on Turbopack. The `--turbo` flag came off in May after Turbopack panicked on deployment, and webpack then spent the whole of Vercel's 45 minute build timeout compiling without ever reaching static generation. Turbopack compiles the same tree in 30 seconds and takes a full local build from 690 seconds to 67. Nothing was holding the build to webpack: `next.config.ts` has no custom `webpack:` function, a `turbopack:` block was already there, and `withPWAConfig` is defined but never applied. A downstream site running the webpack `build:vercel` script moves to `next build --turbopack`. If you turn next-pwa back on, which is a webpack plugin, you go back to `--webpack` and the timeout comes back with it.
- The app shell is redesigned around one type and color system. Inter at 13/20 with tabular figures replaces Poppins and Space Grotesk, cool graphite neutrals carry a single periwinkle accent, 0.5px hairlines replace 1px borders, and motion is limited to what answers touch. The dashboard header is 44px and translucent and draws its hairline only once content scrolls beneath it, sidebar selection is a pill that springs between rows, and every hover is a single transform that stops under `prefers-reduced-motion`.
- Route leaves have one normalized shape and the old dynamic param machinery is gone. A downstream site that reached into route params through the removed helpers moves to the standard Next.js `params` signature.
- `@c15t/nextjs` moves to v2 and its import paths change with it. A downstream site on the v1 imports updates them.
- CI runs the cheap checks everywhere and the expensive ones where they pay for themselves. Typecheck, lint, and unit tests run on every pull request, while integration, build, end-to-end, and docs link checks run on pushes to main and on pull requests labeled `ci:full`. Dependabot runs monthly with a limit of 5 instead of weekly with 10. Actions minutes are billed on this repository and automated pull requests were burning most of them.
- Vercel preview builds skip commits marked `[skip ci]`, `[ci skip]`, or `[skip vercel]`. Preview builds here run cold and take 11 to 14 minutes, and automated syncs and agent pull requests already pass the local verify gate. Production always builds, because a skipped production build would strand the live site on an older deployment.
- Playwright runs against a production build instead of the dev server, which catches prerender failures the dev server hides (LAC-2687).
- CI consolidates: 19 workflows become 10, the standalone `e2e.yml` folds into the `test-e2e` job, GitHub Actions move from v4 to v6 for Node 24, workflow shell inputs are quoted against injection, and heap limits rise for the jobs that were running out of memory (LAC-2670, LAC-2672, LAC-2964, LAC-3408).
- The docs say Next.js 16 everywhere instead of 15, and the Vercel guide covers downstream deployment patterns (LAC-2699).

### Removed

- **Breaking.** The `cli/` directory is gone. The Shipkit CLI lives at [lacymorrow/shipkit-cli](https://github.com/lacymorrow/shipkit-cli) and still publishes to npm as `create-shipkit`, so `npx create-shipkit` keeps working. Nothing in `src/` imported it. A downstream site or script that ran the CLI from a checkout of this repository runs it from npm or from the new repository instead (LAC-3819).
- The homegrown Redis request logger is gone, replaced by the `evlog` facade. A downstream site importing `src/lib/request-logger.ts` switches to `src/lib/logger.ts`, which keeps the same call signature (LAC-3361).
- Marketing copy no longer claims Shipkit is open source. GitHub links point at the `bones` boilerplate, which is the part that actually is.
- The `gemini-pr-review` workflow and an unused Cloudflare DNS analytics MCP server are deleted (LAC-3427).

### Fixed

- `/docs` was 404 on every page at shipkit.io and `/changelog` was empty. `.vercelignore` listed `docs/**` and `*.md` as documentation, but both are build input: `fumadocs-mdx` compiles `docs/` into `.source` and `/docs` prerenders from it, so the Vercel build generated 136 static pages where a local build generated 216. `docs/**` is gone and the markdown rule is scoped to the repository root as `/*.md`, which still skips top-level READMEs without reaching content directories.
- Unknown URLs return a real 404 instead of a 200 with a not-found body. `(app)/loading.tsx` wrapped every page in Suspense and the app layout was async, so a page that fetched and then called `notFound()` had already streamed its 200. The layout is synchronous now, parallel route slots render in fragments, the blanket loading files are gone, and blog, changelog, and docs get existence-check layouts that keep their skeletons and still 404 first. The app error boundary follows the Next.js `{ error, reset }` contract instead of re-exporting a class that renders children it does not have, never shows raw messages in production, and `global-error.tsx` is inline-styled rather than reaching for a stylesheet it never loaded.
- With Payload enabled, the CMS catch-all streamed Payload's shell before the page could call `notFound()`, so any nonsense root URL came back as a soft 404. The content catch-all moves to `src/app/(app)/[...slug]/page.tsx`, where the synchronous root layout settles the status before anything streams. CMS pages get the site chrome and fonts instead of the admin shell, and Payload's layout still wraps `/cms` and `/cms-api`, which are the routes that need it.
- Cold Vercel builds ran out of memory while collecting page data with 3 workers. Each worker loads the whole route graph including Payload and Drizzle, which does not fit in the 8GB builder, so `experimental.cpus` is 1 (LAC-3871).
- Turbopack rejected a mismatch webpack had been hiding. `amazon-cognito-identity-js` 6.3.16 imports `get`, `set`, and `remove` as named exports from `js-cookie`, which v3 provides only as a default, so `CookieStorage` would have thrown at runtime on that path. 6.3.20 is pinned through overrides. The package arrives through `@payloadcms/payload-cloud`.
- `bun dev` returned 500 on every route with an `UnhandledSchemeError`. `instrumentation.ts` imported `evlog` statically and Next compiles that file through webpack, so the opt-in trial cost everyone the dev server whether or not the flag was set. The import happens at runtime now, behind `webpackIgnore` and `turbopackIgnore`, loaded once and only when the flag is on, with `evlog` in `serverExternalPackages` so output tracing still ships it.
- Guest sign-in appears whenever its flag is on, under a divider beneath the other methods. It used to render only when guest was enabled and no other auth method was configured, so a deployed demo with GitHub OAuth on had no guest door at all. A true guest-only setup still gets the dedicated screen.
- A deployment with Resend off and GitHub on reported guest mode, which turns authentication off entirely. The provider flags are optional booleans, so an explicit `NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED=false` is non-nullish and stopped the `??` chain. `getAuthStrategy()` reads the flags with `.some(Boolean)`. Better Auth also gets 22 tests against a real instance on a stub database, after moving from 1.4 to 1.7 with nothing covering it.
- The user menus printed shortcut hints as hand-written text and six of the eight named a key nothing was listening for, including `⇧⌘Q`, which is how macOS logs out of the machine. Both menus render from `ShortcutDisplay` now, a row whose action has no key shows no key, and formatting moves into tested pure functions that fix two things the old parser got wrong: non-Mac parts joined with no separator at all, and Mac modifiers emitted in config order rather than `⌃⌥⇧⌘`.
- Settings had no working keyboard shortcut. `isExactHotkey` compares `event.key`, and holding shift on the comma key reports `<`, never `,`, so `mod+shift+,` could not match anything a person can type. Settings is `mod+shift+S`, matching bones, and a test now refuses any shift binding on a punctuation key.
- Escape stopped being swallowed on every press. Mantine's `useHotkeys` calls `preventDefault` on every binding unless the third tuple element says otherwise, and the provider passed only two, so the global Escape binding consumed every press anywhere in the app to close a popover that is usually not mounted. A binding carries options now: `preventDefault` defaults to true and Escape sets it false, and `onDemand` marks a handler that mounts with something transient so the unhandled-shortcut warning leaves it alone.
- Escape closes the popover from inside its own text field. Mantine ignores keys raised from an `INPUT`, `TEXTAREA`, or `SELECT`, which is right for `mod+K` and wrong for a popover whose whole purpose is a note field, so Escape worked everywhere except the one place a person is looking when they want out. The panel handles a bubbled Escape itself and the global binding stays for the case where focus is outside the panel.
- The upstream remote points at `lacymorrow/shipkit`. The old `shipkit-io/shipkit` remote is dead, so fork sync had been silently doing nothing.
- The Lemon Squeezy checkout URL no longer ships with an `xxx` placeholder store ID.
- Stale deployments time out on their own, whether or not a Vercel token is configured.
- SEO across the site: `og:url` matches the canonical URL on 19 pages, the sitemap directive is live in `robots.txt`, the home page exports metadata, blog category pages generate their own, dynamic OG images are 630px tall, and auth and dashboard pages carry `noIndex`.
- A duplicate `(kit)/page.tsx` and a missing `bones_github` route broke prerendering. The premium page stays and the boilerplate page goes.
- The not-found page renders instead of crashing on its WebGL background, and hero headings balance their text instead of dropping an orphan word onto the last line.
- A lint sweep surfaces two real null-safety bugs, applies 453 nullish-coalescing fixes, and brings typecheck and the test suite to green. Docs lose 15 broken links and their invalid `!info` callouts.

### Security

- **Breaking.** The Lemon Squeezy webhook no longer trusts `custom_data.user_id` to identify the buyer. That value comes from the attacker-controllable checkout query string, so anyone could pay for a product and have it credited to another account. The hint is honored only when the hinted user's email matches the HMAC-verified webhook email, and everything else falls through to the email lookup. A downstream site that relied on passing `checkout[custom][user_id]` to attribute a purchase attributes by email instead.
- **Breaking.** A deployment with no `APP_SECRET` can no longer derive its secrets, and its next production build fails with an error saying so. `src/config/secrets.ts` hashed the public `BASE_URL` when `APP_SECRET` was unset and fed that into `AUTH_SECRET`, `PAYLOAD_SECRET`, and `BETTER_AUTH_SECRET`, so anyone who knew a site's URL could reconstruct all three and forge sessions. It only warned and booted. Those deployments have forgeable sessions today, which is why this fails loudly. Development still derives, and a deployment that sets all three secrets explicitly is never asked for a master. The same file kept an empty string through its `??` fallbacks, so an unset Vercel variable left `AUTH_SECRET=""` instead of deriving; it falls back on anything blank now (LAC-3811).
- **Breaking.** The shipped admin backdoor is closed. `admin-config.ts` defaulted to `emails: ["me@lacymorrow.com"]` and `domains: ["lacymorrow.com"]`, so every downstream deployment granted admin to anyone holding an address at that domain. Both default to empty. The domain test was `email.endsWith("@" + domain)`, which accepts `attacker@evil-lacymorrow.com`, and it compares the domain exactly now. A downstream site that relied on the inherited defaults lists its own admin emails or domains (LAC-3811).
- **Breaking.** Linking a new OAuth provider to an existing account requires the provider to assert it verified the address. `allowDangerousEmailAccountLinking` was true on all seven providers, so a new provider attached itself to whatever account already owned that email. First-time signups are unaffected, since they link to nothing (LAC-3811).
- `isAdmin()` consulted the static config before any database lookup, so a matching email string alone was enough. The account must exist and have a verified email. `verifyEmail(userId)`, `ensureUserExists()`, and `updateProfile()` were exported as server actions with no authentication, and are guarded now (LAC-3811).
- `isAdmin()` is async, and four call sites tested it without awaiting. The condition was `!somePromise`, which is always false, so `requireAdmin()` threw for nobody and any signed-in user with an email cleared it. The two CMS server actions and the integration status service were open the same way. The fix is an `await` at `server/lib/auth.ts`, `services/integration-service.ts`, and `(admin)/admin/integrations/actions.ts`.
- Every critical and high advisory is cleared. All 16 lived in six packages that already had published patches, and the version constraints were what kept them out: `better-auth` moves from `~1.5.6` to `^1.6.33` for an OAuth refresh-token replay and a magic-link pre-account hijack, both live since magic link shipped as a production method; `fast-uri` to `^3.1.6` for SSRF and host confusion; `sharp` to `^0.35.4`; `ws` to `^8.21.3`; `jspdf` to `^4.2.1` for HTML injection; and `lodash-es` to `^4.18.1` for code injection through `_.template`. The existing overrides block was namespaced under `pnpm`, which Bun never reads.
- Every remaining Tier 0 and Tier 1 advisory is cleared through top-level overrides pinned to the lowest patched version inside the current major. Tier 0 goes from 11 to 0 and Tier 1 from 6 to 0. `isolated-vm` is pinned to `^7.0.1`, because 6.0.2 cannot compile against the V8 API in Node 26.3.1 and `bun install` died in node-gyp for anyone not passing `--ignore-scripts`. `sharp` is pinned to `^0.35.4` because `@huggingface/transformers` asks for `^0.34.1` and a caret on a 0.x range cannot cross to 0.35, which left a second vulnerable copy in the tree.

## [0.2.2] - 2026-05-15

Never tagged in git. This section covers the work between the `v0.2.1` tag and the `0.2.2` version bump.

### Added

- A `shipkit` CLI scaffolds, syncs, and deploys sites. `create` grafts a new project from the framework, `sync` pulls upstream changes and resolves graft conflicts on its own, and `deploy` pushes to Vercel. It publishes to npm as `create-shipkit`. The CLI has since moved out of this repository; see the Unreleased section.
- The shadcn registry ships 35 blocks covering legal pages, changelog, contact, waitlist, admin, settings, demo, email, feedback, analytics, caching, storage, pricing, and payments. `bun run build:registry` writes them to `public/r/*.json`.
- The changelog page builds itself from markdown files in the repo and falls back to the GitHub API. Ten more MDX components are registered for docs, blog, and changelog content.
- `/api/flags` overrides feature flags per request through query parameters, so you can preview a flagged feature without redeploying.
- `/api/version` reports the build version, commit SHA, and build time (LAC-842).
- Devtools give you a font selector that changes fonts across the whole page, a Tailwind breakpoint indicator, and an extended header, each behind its own feature flag. An RSS feed is served at `/rss.xml`.
- Cloudflare Turnstile guards forms, and Google Analytics and Google Tag Manager load through the analytics provider. Each enables itself when its environment variables are set.
- `react-grab` lets you select an element in the browser and hand it to an AI agent, with the agent server starting automatically in dev.
- Interactive components fire haptic feedback through the Vibration API on devices that support it.
- Crawlers and language models can find their way around: repository discovery through `vcs-git` metadata, JSON-LD, `.well-known`, and `humans.txt`, plus `llms.txt` and AI meta tags. Dynamic OG images render dark or light from a query parameter.
- The dashboard is rebuilt on demo components with mock data in one place, so a downstream site sees every panel before wiring real data.
- Deployment health reports through the GitHub Checks API, and a Vercel automation bypass secret lets the check reach protected preview deployments.
- A `wei/pull` config keeps downstream forks syncing from this repository, and the rebrand script renames a fork end to end.

### Changed

- **Breaking.** The package is renamed from `ship-kit` to `shipkit`. Anything that depends on it by name updates the dependency.
- **Breaking.** Shipkit is relicensed to FSL-1.1-MIT. Read the terms before shipping a fork; the old license no longer applies.
- **Breaking.** Next.js 16 replaces Next.js 15, and Turbopack is the dev bundler. `reactCompiler` moves to the top level of `next.config.ts`, NextAuth moves to beta.31, `react-resizable-panels` moves to v4, and `@c15t/nextjs` v1 import paths change. A downstream site upgrades all of these together.
- **Breaking.** Subscription plans are gone. Pricing is a one-time purchase, so a downstream site selling subscriptions keeps its own plan code.
- Registry blocks prefix their custom dependencies with `@shipkit/` and use `~/src/` target paths, so installs land correctly in projects with a `src` directory.
- Bun is the package manager and the pnpm lockfile is removed.
- The root layout is static. The `auth()` call moves down to the dashboard layout, which keeps marketing pages off the dynamic path.
- The homepage is redesigned, the landing copy is rewritten, and the blog and changelog use a minimal header variant instead of the full marketing header.
- The docs folder is restructured, cross-references are repaired, and new guides cover the CLI, quickstart, deployment checks, and downstream setup requirements.
- ESLint loads plugins directly rather than through `FlatCompat`, which was failing with a circular JSON error. CI moves from Node 20 to Node 22.

### Removed

- The Gemini automated issue triage, Gemini CLI, and Claude triage workflows are deleted.
- The sweetlink integration is removed, and `setup-upstream` and `patch-payload-imports` no longer run on postinstall.

### Fixed

- Payload CMS broke Vercel builds by importing CSS and SCSS from packages Node's ESM loader cannot parse. `@payloadcms/ui` and `@payloadcms/richtext-lexical` are patched to drop those imports, and the `(payload)` layout imports Payload packages conditionally.
- The AWS S3 client is bundled rather than externalized, which was returning 500s at runtime on Vercel. `/docs` returned 500 from ESM-only estree packages, which are now transpiled.
- GitHub sign-in failed with a PKCE error. The OAuth server action is awaited so the redirect completes, and `trustHost` is set for Vercel callbacks.
- Sessions load again. `SessionProvider` no longer receives `session={null}`, which was blanking the session on first render. The OAuth buttons are wrapped in Suspense, so the sign-in form stops sticking in a loading state.
- The changelog served stale, empty results. Content is read from build-time manifests instead of `fs.readdir` at runtime, and `unstable_cache` is out of the path. Blog posts sort by `publishedAt` descending, so the newest post is first.
- Canonical URLs are correct, noindex pages are out of the sitemap, changelog entries are in it, and the CMS catch-all route no longer leaks `noindex` onto `/docs` pages (LAC-1217).
- HolyLoader takes its colors from the CSS theme variables, with a Shipkit-specific gradient kept in `overrides.css`.
- The onboarding wizard appears only when the Vercel and GitHub integrations are both present, and the API Keys page no longer crashes when the user is undefined.
- Search results scroll, the same query cannot be resubmitted, and a failed AI search leaves the static results in place instead of clearing them.
- The React Compiler is enabled to resolve a `useMemoCache` runtime error, `isolated-vm` is stubbed out so Vercel builds complete, and `FileTree` guards against undefined files during SSR prerender.

## [0.2.1] - 2025-09-22

The first tagged release. Shipkit arrives as a working framework rather than a set of parts, so most of what follows landed together.

### Added

- The application framework: Next.js App Router, TypeScript, Tailwind, Shadcn/UI on Radix, Drizzle ORM on Postgres, and Bun.
- Authentication through NextAuth v5. You can sign in with Google, GitHub, or Discord, through a magic link, with credentials, or as a guest, and each provider enables itself when its environment variables are set. Better Auth and Clerk are available as alternatives.
- Payments through Lemon Squeezy, Stripe, or Polar, each with a signed webhook handler, a checkout route, and an admin view that lists and imports payments.
- Payload CMS v3 runs the admin panel and user management for credentials auth, with a GraphQL endpoint and a preview route. Builder.io renders visually built pages through a catch-all route and a component registry.
- Documentation and blog content is MDX rendered through Fumadocs, with author configuration, heading extraction, and reading-time formatting.
- A Vercel deployment dashboard deploys public and private repositories, tracks deployment status, and times out stalled deployments.
- Feature flags read from `NEXT_PUBLIC_FEATURE_*` environment variables. A feature that is not configured disables itself rather than failing.
- Teams, API keys, waitlists, and feedback are modeled in the schema with server actions behind them. Rate limiting runs through Redis and file storage runs through S3.
- The multi-zone architecture is documented with an example configuration, so a site can run marketing, app, and docs as separate Next.js deployments behind one domain.
- An onboarding wizard and an intro disclosure walk a new user through first setup.
- Schema prefixing through `DB_PREFIX` lets several Shipkit sites share one Postgres database.

### Changed

- **Breaking.** The NextAuth configuration moves under `src/server/auth-js/`. A downstream site importing `src/server/auth.config.ts`, `src/server/auth-providers.config.ts`, or `src/server/auth-providers-utils.ts` updates those paths.
- Payment server actions are consolidated into `payment-service`, which cuts the action layer down to calls into the service. Logging consolidates into one logger and `otel-logger` is removed.
- Team and user services are rewritten around explicit transactions.

### Removed

- The globe, canvas reveal, and card spotlight demo components are deleted, along with a 12,000 line globe dataset. The visitor location server action goes with them.

### Fixed

- GitHub sign-in populates the name and avatar under both database and JWT sessions.
- Date fields in the JWT are stored as ISO strings and reconstructed in the session, which stops runtime errors from code calling `Date` methods on session fields.

[unreleased]: https://github.com/lacymorrow/shipkit/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/lacymorrow/shipkit/releases/tag/v0.2.1
