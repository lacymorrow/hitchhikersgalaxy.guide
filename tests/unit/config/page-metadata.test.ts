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
 * The helper only holds if pages actually use it. A page that hand-writes
 * `alternates.canonical` re-opens the mismatch, and the symptom is invisible
 * locally: the tags render, they just point at the wrong URL.
 */
describe("pages that declare a canonical", () => {
  it("route every canonical through pageMetadata", async () => {
    const appDir = join(process.cwd(), "src/app");
    const files = (await readdir(appDir, { recursive: true })) as string[];
    const pages = files.filter((f) => f.endsWith("page.tsx") || f.endsWith("page.mdx"));
    expect(pages.length).toBeGreaterThan(0);

    const offenders: string[] = [];
    let withCanonical = 0;
    for (const page of pages) {
      const source = await readFile(join(appDir, page), "utf8");
      if (!source.includes("canonical")) continue;
      withCanonical++;
      if (!source.includes("pageMetadata(")) offenders.push(page);
    }

    expect(withCanonical).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });
});
