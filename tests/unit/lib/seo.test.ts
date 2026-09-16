import { describe, expect, it } from "vitest";
import {
	clampAtWord,
	dedupeGuideEntries,
	guideEntryPath,
	guideEntrySeo,
	SEO_TITLE_BRAND,
} from "@/lib/seo";

describe("clampAtWord", () => {
  it("returns short text unchanged", () => {
    expect(clampAtWord("Towel", 60)).toBe("Towel");
  });

  it("clamps at a word boundary", () => {
    expect(clampAtWord("The Answer to Life the Universe", 20)).toBe("The Answer to Life");
  });

  it("hard-clamps a single long word", () => {
    expect(clampAtWord("a".repeat(80), 60)).toHaveLength(60);
  });
});

describe("guideEntrySeo", () => {
  // Regression for LAC-3514: entry titles rendered as
  // "<term> - The Hitchhiker's Guide | The Hitchhiker's Guide to the Galaxy Guide"
  // (76+ chars) — 41 URLs flagged by Ahrefs as "Title too long".
  it("keeps short terms template-relative so the rendered title stays under 60 chars", () => {
    const seo = guideEntrySeo("Towel");
    expect(seo.title).toBe("Towel");
    expect(seo.displayTitle).toBe(`Towel | ${SEO_TITLE_BRAND}`);
    expect(seo.displayTitle.length).toBeLessThanOrEqual(60);
  });

  it("uses an absolute clamped title for long terms", () => {
    const longTerm = "The Answer to Life the Universe and Everything Else Entirely";
    const seo = guideEntrySeo(longTerm);
    expect(seo.title).toEqual({ absolute: seo.displayTitle });
    expect(seo.displayTitle.length).toBeLessThanOrEqual(60);
  });

  it("keeps descriptions within 160 chars even for long terms", () => {
    const seo = guideEntrySeo("A Very Long Search Term About Pan Galactic Gargle Blasters");
    expect(seo.description.length).toBeLessThanOrEqual(160);
    expect(seo.description).toContain("Hitchhiker's Guide to the Galaxy");
  });
});

describe("guideEntryPath", () => {
  it("encodes spaces so the path matches sitemap URLs", () => {
    expect(guideEntryPath("thai food")).toBe("/thai%20food");
  });

  it("preserves hyphenated terms as-is", () => {
    expect(guideEntryPath("skibidi-toilet")).toBe("/skibidi-toilet");
  });

  it("encodes characters that are unsafe in URLs", () => {
    expect(guideEntryPath("fish & chips")).toBe("/fish%20%26%20chips");
  });
});

describe("dedupeGuideEntries", () => {
  // Regression for LAC-3918: the DB holds duplicate rows per search term
  // ("test" x3, "tribble" x2, ...), which put 38 duplicate URLs in the
  // sitemap (Ahrefs "Duplicate pages without canonical" / GSC "Duplicate,
  // Google chose different canonical than user").
  it("collapses rows with the same search term", () => {
    const entries = [
      { searchTerm: "tribble", updatedAt: new Date("2026-01-01") },
      { searchTerm: "tribble", updatedAt: new Date("2026-03-01") },
      { searchTerm: "towel", updatedAt: new Date("2026-02-01") },
    ];
    const deduped = dedupeGuideEntries(entries);
    expect(deduped.map((e) => e.searchTerm)).toEqual(["tribble", "towel"]);
  });

  it("keeps the most recent updatedAt among duplicates", () => {
    const deduped = dedupeGuideEntries([
      { searchTerm: "tribble", updatedAt: new Date("2026-01-01") },
      { searchTerm: "tribble", updatedAt: new Date("2026-03-01") },
    ]);
    expect(deduped[0]?.updatedAt).toEqual(new Date("2026-03-01"));
  });

  it("collapses rows that only differ by case or surrounding whitespace", () => {
    const deduped = dedupeGuideEntries([
      { searchTerm: "Tribble", updatedAt: null },
      { searchTerm: "tribble ", updatedAt: null },
    ]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.searchTerm).toBe("tribble");
  });

  it("drops rows whose term normalizes to nothing", () => {
    expect(dedupeGuideEntries([{ searchTerm: "  ", updatedAt: null }])).toEqual([]);
  });
});
