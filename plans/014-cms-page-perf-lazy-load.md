# Plan 014: Lazy-load Builder.io SDK and dedupe `getPageData` in the CMS catch-all

> **Executor instructions**: Follow this plan step by step. If anything in
> the "STOP conditions" section occurs, stop and report. When done, update
> the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6358b2b2..HEAD -- src/app/\(cms\)/\[\.\.\.slug\]/page.tsx`

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW–MED
- **Depends on**: none.
- **Category**: performance
- **Planned at**: commit `6358b2b2`, 2026-06-11
- **Issue**: https://github.com/lacymorrow/shipkit/issues/235

## Why this matters

The CMS catch-all route at `src/app/(cms)/[...slug]/page.tsx`:

1. Imports and _initializes_ the Builder.io SDK at the top of the module —
   it loads even when `NEXT_PUBLIC_FEATURE_BUILDER_ENABLED` is false and
   even on routes that resolve entirely from Payload.
2. Calls `getPageData(params.slug, 1)` once in `generateMetadata` and again
   in the page component itself, with no shared cache between them — every
   CMS page render queries Payload twice.
3. `getPageData` itself runs up to three sequential Payload queries
   (progressive slug-match fallback) — when a request doesn't match, all
   three round-trip.

Combined, a single 404 path can issue 6 Payload queries. The fixes are
mechanical and well-isolated.

## Current state

```ts
// src/app/(cms)/[...slug]/page.tsx (key excerpts)
// L7
import { type BuilderContent, builder } from "@builder.io/sdk";
// L14-16
builder.init(env.NEXT_PUBLIC_BUILDER_API_KEY ?? "");   // runs at module load
// L76-103 — getPageData with three sequential payload.find() calls
async function getPageData(slug: string[], depth = 1): Promise<…> {
  const payload = await getPayloadClient();
  // attempt 1: exact slug match
  const exact = await payload.find({ … });
  if (exact.docs.length) return exact;
  // attempt 2: first-segment match
  const first = await payload.find({ … });
  if (first.docs.length) return first;
  // attempt 3: LIKE pattern
  const fuzzy = await payload.find({ … });
  return fuzzy;
}
// L144 — first call in generateMetadata
const data = await getPageData(params.slug, 1);
// L191 — second call in Page component
const data = await getPageData(params.slug, 1);
```

(Confirm line numbers; the file may have drifted slightly.)

## Commands you will need

| Purpose   | Command             | Expected       |
| --------- | ------------------- | -------------- |
| Install   | `bun install`       | exit 0         |
| Typecheck | `bun run typecheck` | no new errors  |
| Tests     | `bun run test`      | no regressions |

## Scope

**In scope:**

- `src/app/(cms)/[...slug]/page.tsx` — defer Builder import + dedupe getPageData with React `cache()`.

**Out of scope:**

- Refactoring `getPayloadClient()` (the underlying client init). If init is
  expensive that's its own plan.
- Replacing the three-fallback search with a single Payload query — needs
  Payload schema understanding and search ranking; do as a separate
  plan if needed.
- The Builder.io content-rendering code further down the file — only the
  _initialization_ moves.
- Other CMS routes.

## Git workflow

- Branch: `advisor/014-cms-page-perf`
- One commit: `perf(cms): lazy-load Builder SDK and dedupe getPageData per request`

## Steps

### Step 1: Wrap `getPageData` in React `cache`

At the top of the file:

```ts
import { cache } from "react";
```

Change the function declaration:

```ts
// before
async function getPageData(slug: string[], depth = 1) { … }

// after
const getPageData = cache(async (slug: string[], depth = 1) => { … });
```

That's it — the existing two call sites (in `generateMetadata` and the
page component) now share a result for matching `(slug, depth)` within the
same request. No call-site changes.

Caveat: `cache()` uses argument identity for keys. `slug: string[]` is an
array, two arrays with the same contents are _not_ identity-equal. Wrap
with a string-keyed version:

```ts
const getPageDataInner = cache(async (slugKey: string, depth = 1) => {
  const slug = slugKey.split("/");
  // existing body, using `slug`
});

async function getPageData(slug: string[], depth = 1) {
  return getPageDataInner(slug.join("/"), depth);
}
```

Now identical slug arrays map to the same cache key.

### Step 2: Lazy-load Builder.io SDK

Move the Builder imports and `builder.init(...)` out of module scope into
a function. Two clean options:

**Option A (simplest):** wrap initialization in a memoized helper.

```ts
import { cache } from "react";

const getBuilder = cache(async () => {
  if (!env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED) return null;
  const { builder } = await import("@builder.io/sdk");
  builder.init(env.NEXT_PUBLIC_BUILDER_API_KEY ?? "");
  return builder;
});
```

Where Builder is used, replace `builder.someMethod` with
`(await getBuilder())?.someMethod` and handle the null case (Builder
disabled → skip the Builder path entirely).

**Option B (more invasive but cleaner if Builder is used heavily in this
file):** extract Builder-using helpers to a sibling module that's
dynamically `import()`-ed only when the feature is on. Use Option B only if
Builder usage in this file is non-trivial; Option A handles the typical
case.

### Step 3: Verify the Builder import is no longer at module top

`grep -n "@builder.io/sdk" src/app/\(cms\)/\[\.\.\.slug\]/page.tsx`

Should match only the dynamic `await import(…)`.

### Step 4: Run typecheck

`bun run typecheck` — fix any errors. The dynamic import returns a
namespace; the destructured `builder` should still type-check.

### Step 5: Smoke test in dev

1. `bun dev`.
2. Hit a CMS page that exists in Payload. Verify it renders.
3. Add a `logger.debug` (temporarily) inside `getPageDataInner` to count
   calls per request.
4. Reload — expect one log line per page load instead of two.
5. With `NEXT_PUBLIC_FEATURE_BUILDER_ENABLED=false`, hit a page that
   should resolve from Payload only. Confirm the Builder SDK is NOT
   downloaded (check the network tab on a fresh load) — the dynamic
   `import` should not fire.

Remove the temporary `logger.debug` before commit.

### Step 6: Note about the three-fallback search

This plan deliberately does NOT collapse the three sequential `payload.find` calls into one. Doing so safely requires understanding the Payload query API's OR-condition support and the intended fallback ranking. If you have evidence the current fallback is incorrect or wasteful at scale, write a separate plan with that scope.

## Test plan

No new automated tests (CMS-route render tests are awkward in Vitest
without a full Next harness). Verification by Step 5 smoke test.

If you want a regression test for `getPageData` shape after `cache`, add a
unit test that calls `getPageDataInner` twice with the same key in a row
and asserts the underlying `payload.find` mock was called exactly once.
That's a 10-line test, worth it if you can mock `getPayloadClient`
quickly.

## Done criteria

- [ ] `bun run typecheck` exits 0 (no new errors).
- [ ] `bun run test` exits 0.
- [ ] `grep -n "builder.init" src/app/\(cms\)/\[\.\.\.slug\]/page.tsx` shows the init inside a function, not at module scope.
- [ ] Smoke test: a CMS page reload triggers one `getPageData` execution, not two.
- [ ] Smoke test: with Builder disabled, the Builder SDK does not appear in the network tab.
- [ ] `plans/README.md` status row for 014 updated.

## STOP conditions

- The Builder SDK has side effects on import (e.g. registers components
  globally) that the rest of the file depends on. Lazy-loading then breaks
  static analysis. If so, gate the entire route on
  `NEXT_PUBLIC_FEATURE_BUILDER_ENABLED` and short-circuit at the top
  instead.
- `getPayloadClient()` is itself non-deterministic per call (e.g. returns
  a different client object each time). `cache()` keying still works, but
  you should also wrap `getPayloadClient` if profiling shows duplicate
  initialization.

## Maintenance notes

- The `cache()` wrap is request-scoped. Don't add manual invalidation.
- If a future change adds a third call to `getPageData` (e.g. a sitemap
  generator at build time), the `cache` is per-request, so each build-time
  page generates fresh. That's correct.
- Reviewer should scrutinize: the dynamic import's null path is handled
  everywhere `builder` was previously referenced; no leftover top-level
  `builder.init` call.

## Backfill candidate for `shipkit-io/bones`

Yes — same code likely in bones if the CMS catch-all is shared.
