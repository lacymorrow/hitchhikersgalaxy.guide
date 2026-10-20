/**
 * First-segment static routes that shadow the `[slug]` guide catch-all.
 *
 * Any DB entry whose normalized term equals one of these (e.g. "browse",
 * "popular", "sign-in") renders the static route instead of the guide entry.
 * Some of those static routes are intentionally noindex (demo and dashboard
 * layouts), so advertising them as guide entries triggered Ahrefs "Noindex
 * page in sitemap" / "Orphan page" (LAC-4156).
 *
 * This list is hardcoded on purpose. The first version scanned `src/app` with
 * `readdir` at request time, which passes locally and silently returns an
 * empty set on Vercel: Next.js traces bundle dependencies statically, so a
 * path built from `process.cwd()` is never traced and the `src/app` sources
 * are not in the serverless bundle. The filter would have no-opped in prod
 * while looking healthy in dev. `tests/unit/lib/guide-routes.test.ts` scans
 * the app directory and fails if this list drifts, so new routes still get
 * caught — at build time, where an empty result is a red test instead of a
 * silent miss.
 *
 * Segments are first-path-segment names with route groups `(x)`, dynamic
 * params `[x]`, parallel routes `@x`, and private folders `_x` skipped, since
 * none of those contribute to the URL.
 */
export const GUIDE_SHADOW_ROUTE_SEGMENTS: ReadonlySet<string> = new Set([
  "about",
  "browse",
  "contact",
  "error",
  "eula",
  "forgot-password",
  "legal",
  "popular",
  "privacy-policy",
  "reset-password",
  "sign-in",
  "sign-up",
  "slug",
  "submit",
  "terms-of-service",
  "travel-guide",
]);

/** True when `term` collides with a static route and must not be advertised as a guide entry. */
export const isShadowRouteSegment = (term: string): boolean =>
  GUIDE_SHADOW_ROUTE_SEGMENTS.has(term.toLowerCase());
