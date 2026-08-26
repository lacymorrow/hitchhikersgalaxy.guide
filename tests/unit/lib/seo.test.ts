import { describe, expect, it } from "vitest";
import { clampAtWord, guideEntrySeo, SEO_TITLE_BRAND } from "@/lib/seo";

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
