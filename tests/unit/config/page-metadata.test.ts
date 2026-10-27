import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pageMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site";
import { guideEntryPath, guideEntrySeo } from "@/lib/seo";

/**
 * Two Ahrefs error classes came from writing a page's canonical and its Open
 * Graph tags as separate literals:
 *
 *  - "OG URL not matching canonical" (9 URLs). Pages set their own canonical
 *    but inherited `openGraph.url` from the root layout, so every page claimed
 *    the homepage as its Open Graph URL.
 *  - "Open Graph tags incomplete" (309 URLs, every guide entry). Next.js
 *    replaces an inherited `openGraph` object instead of deep-merging it, so
 *    declaring a page-level `openGraph` dropped the layout's image, site name
 *    and locale.
 */
describe("pageMetadata", () => {
  const paths = ["/", "/browse", "/popular", "/about", "/travel-guide", "/contact", "/legal"];

  it.each(paths)("declares the same URL as canonical and og:url for %s", (path) => {
    const meta = pageMetadata({ path, title: "Example", description: "Example page." });
    expect(meta.alternates?.canonical).toBe(meta.openGraph?.url);
  });

  it("resolves the homepage to the bare origin, with no trailing slash", () => {
    // Next resolves a "/" canonical to the origin without a slash. A slash
    // here would be a fresh canonical/og:url mismatch rather than a fix.
    const meta = pageMetadata({ path: "/", title: { absolute: "Home" }, description: "Home." });
    expect(meta.alternates?.canonical).toBe(siteConfig.url);
  });

  it("keeps the shared Open Graph image, site name and locale", () => {
    const meta = pageMetadata({ path: "/browse", title: "Guide Index", description: "A to Z." });
    expect(meta.openGraph?.images).toEqual([
      { url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.name },
    ]);
    expect(meta.openGraph?.siteName).toBe(siteConfig.name);
    expect(meta.openGraph?.locale).toBe("en_US");
  });

  it("resolves the brand suffix for card titles, which Next does not template", () => {
    const meta = pageMetadata({ path: "/about", title: "About the Guide", description: "x" });
    expect(meta.openGraph?.title).toBe("About the Guide | The Hitchhiker's Guide");
    expect(meta.twitter?.title).toBe("About the Guide | The Hitchhiker's Guide");
    // The page title stays template-relative so the layout appends the brand.
    expect(meta.title).toBe("About the Guide");
  });

  it("leaves an absolute title alone so the brand is not duplicated", () => {
    const absolute = "The Hitchhiker's Guide to the Galaxy Guide";
    const meta = pageMetadata({ path: "/", title: { absolute }, description: "x" });
    expect(meta.openGraph?.title).toBe(absolute);
  });

  /**
   * `guideEntrySeo` has two branches and they resolve the card title
   * differently: short terms get the `%s | brand` suffix, terms too long for
   * it get an absolute clamped title instead. `pageMetadata` has to agree with
   * both, or long entries share under a title that does not match their page.
   */
  it("agrees with guideEntrySeo on a term too long for the title template", () => {
    const longTerm =
      "The Restaurant At The End Of The Universe And Its Many Peculiar Patrons Including Vogons";
    const { title, displayTitle, description } = guideEntrySeo(longTerm);
    // Precondition: this term must actually take the absolute branch.
    expect(typeof title).toBe("object");

    const meta = pageMetadata({
      path: guideEntryPath("long-term"),
      title,
      description,
      type: "article",
    });

    expect(meta.openGraph?.title).toBe(displayTitle);
    expect(meta.twitter?.title).toBe(displayTitle);
    // Both card titles now equal displayTitle, so clamping it clamps them.
    // The whole point of the absolute branch is staying inside Google's limit.
    expect(displayTitle.length).toBeLessThanOrEqual(60);
  });

  it("agrees with guideEntrySeo on a guide entry's card title", () => {
    const { title, displayTitle, description } = guideEntrySeo("Babel Fish");
    const meta = pageMetadata({
      path: guideEntryPath("babel-fish"),
      title,
      description,
      type: "article",
    });
    expect(meta.openGraph?.title).toBe(displayTitle);
    expect(meta.openGraph?.url).toBe(`${siteConfig.url}/babel-fish`);
    expect((meta.openGraph as { type?: string })?.type).toBe("article");
  });
});

/**
 * The helper only holds if pages actually use it, and both halves of the
 * defect regress independently:
 *
 *  - a page hand-writing `alternates.canonical` re-opens the URL mismatch
 *  - a page hand-writing `openGraph` re-opens the dropped image, because Next
 *    replaces the inherited object rather than merging into it
 *
 * The second one needs no canonical at all to regress, so scanning only for
 * `canonical` would leave the larger error class (309 URLs) unguarded. Both
 * symptoms are invisible locally: the tags render, they are just wrong.
 */
describe("pages that declare their own metadata", () => {
  /** Matches `canonical:` in a metadata object, not the word in prose or an identifier. */
  const DECLARES_CANONICAL = /\bcanonical\s*:/;
  /** Matches `openGraph:` as a metadata key. */
  const DECLARES_OPEN_GRAPH = /\bopenGraph\s*:/;

  const appPages = async () => {
    const appDir = join(process.cwd(), "src/app");
    const files = (await readdir(appDir, { recursive: true })) as string[];
    const pages = files.filter((f) => f.endsWith("page.tsx") || f.endsWith("page.mdx"));
    expect(pages.length).toBeGreaterThan(0);
    return Promise.all(
      pages.map(async (page) => ({ page, source: await readFile(join(appDir, page), "utf8") }))
    );
  };

  it("route every canonical and every openGraph through pageMetadata", async () => {
    const offenders = (await appPages())
      .filter(({ source }) => DECLARES_CANONICAL.test(source) || DECLARES_OPEN_GRAPH.test(source))
      .filter(({ source }) => !source.includes("pageMetadata("))
      .map(({ page }) => page);

    expect(offenders).toEqual([]);
  });

  /**
   * Guards the guard. The check above is a source scan, so it passes trivially
   * if the patterns stop matching anything. Assert the helper is actually in
   * use on the pages we converted, which is what makes a zero-offender result
   * mean something.
   */
  it("still finds the pages that were converted to the helper", async () => {
    const users = (await appPages())
      .filter(({ source }) => source.includes("pageMetadata("))
      .map(({ page }) => page);

    expect(users.length).toBeGreaterThanOrEqual(11);
    expect(users.filter((p) => p.endsWith(".mdx")).length).toBeGreaterThanOrEqual(4);
  });
});
