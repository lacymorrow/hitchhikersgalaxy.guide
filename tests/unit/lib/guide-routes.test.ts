import { readdir } from "node:fs/promises";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { GUIDE_SHADOW_ROUTE_SEGMENTS, isShadowRouteSegment } from "@/lib/guide-routes";

/**
 * Derive the shadow set the same way the hardcoded list was built: the first
 * URL-contributing path segment of every page file under `src/app`.
 */
async function scanAppDirectory(): Promise<Set<string>> {
  const files = (await readdir(join(process.cwd(), "src/app"), { recursive: true })) as string[];
  const segments = new Set<string>();
  for (const file of files) {
    if (!file.endsWith("page.tsx") && !file.endsWith("page.mdx")) continue;
    for (const part of file.split(sep)) {
      if (part === "page.tsx" || part === "page.mdx") break;
      // Route groups `(x)`, dynamic params `[x]`, parallel routes `@x`, and
      // private folders `_x` contribute nothing to the URL.
      if (/^[([@_]/.test(part)) continue;
      segments.add(part.toLowerCase());
      break;
    }
  }
  return segments;
}

describe("GUIDE_SHADOW_ROUTE_SEGMENTS", () => {
  // The first version of this filter scanned src/app with readdir at request
  // time. Next.js traces bundle deps statically, so a path built from
  // process.cwd() is never traced, the sources are absent from the Vercel
  // serverless bundle, and the catch swallowed the error into an empty Set —
  // the filter no-opped in prod and passed in dev. Keep the list static and
  // let this test be the thing that fails when routes drift.
  it("matches the routes actually present under src/app", async () => {
    const scanned = await scanAppDirectory();
    expect([...scanned].sort()).toEqual([...GUIDE_SHADOW_ROUTE_SEGMENTS].sort());
  });

  it("is never empty", () => {
    expect(GUIDE_SHADOW_ROUTE_SEGMENTS.size).toBeGreaterThan(0);
  });

  it("matches case-insensitively and rejects non-routes", () => {
    expect(isShadowRouteSegment("Browse")).toBe(true);
    expect(isShadowRouteSegment("travel-guide")).toBe(true);
    expect(isShadowRouteSegment("babel fish")).toBe(false);
  });
});
