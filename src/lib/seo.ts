/**
 * SEO helpers for guide entry pages.
 *
 * Google truncates SERP titles around 60 characters and descriptions around
 * 160; Ahrefs flags anything longer (LAC-3514 flagged 41 overlong titles
 * produced by the previous `<term> - The Hitchhiker's Guide | <42-char site
 * name>` template output).
 */

import { normalizeSlug } from "@/lib/utils";

/** Short brand used in page titles; the full site name is too long for SERPs. */
export const SEO_TITLE_BRAND = "The Hitchhiker's Guide";

/**
 * Canonical site-relative path for a guide entry. Every internal link,
 * canonical tag, and sitemap URL must go through this so an entry only ever
 * has one URL (LAC-3918: hyphen/space and case variants of the same entry
 * were each self-canonicalizing, so Google picked its own canonical).
 */
export function guideEntryPath(searchTerm: string): string {
  return `/${encodeURIComponent(searchTerm)}`;
}

/**
 * Collapse guide-entry rows that resolve to the same entry URL. The DB holds
 * duplicate rows per term ("test" x3, "tribble" x2, case/whitespace variants),
 * which produced 38 duplicate sitemap URLs. Returns normalized terms, keeping
 * the newest `updatedAt` among duplicates.
 */
export function dedupeGuideEntries<T extends { searchTerm: string; updatedAt: Date | null }>(
  entries: T[]
): T[] {
  const byTerm = new Map<string, T>();
  for (const entry of entries) {
    const term = normalizeSlug(entry.searchTerm);
    if (!term) continue;
    const existing = byTerm.get(term);
    if (!existing || (entry.updatedAt?.getTime() ?? 0) > (existing.updatedAt?.getTime() ?? 0)) {
      byTerm.set(term, { ...entry, searchTerm: term });
    }
  }
  return [...byTerm.values()];
}

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;
/** Matches the `%s | ${SEO_TITLE_BRAND}` template in src/config/metadata.ts */
const TITLE_TEMPLATE_SUFFIX_LENGTH = ` | ${SEO_TITLE_BRAND}`.length;

/** Clamp text to `max` characters without cutting mid-word. */
export function clampAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : text.slice(0, max)).trimEnd();
}

export interface GuideEntrySeo {
  /** Next.js Metadata title: template-relative for short terms, absolute for long ones. */
  title: string | { absolute: string };
  /** Fully-resolved title string for OpenGraph/Twitter cards. */
  displayTitle: string;
  description: string;
}

/** Build SERP-safe title and description metadata for a guide entry. */
export function guideEntrySeo(name: string): GuideEntrySeo {
  const fitsTemplate = name.length + TITLE_TEMPLATE_SUFFIX_LENGTH <= TITLE_MAX;
  const displayTitle = fitsTemplate ? `${name} | ${SEO_TITLE_BRAND}` : clampAtWord(name, TITLE_MAX);

  const description = clampAtWord(
    `${name} in the Hitchhiker's Guide to the Galaxy: travel advice, where to find it, what to avoid, and fun facts. Don't Panic!`,
    DESCRIPTION_MAX
  );

  return {
    title: fitsTemplate ? name : { absolute: displayTitle },
    displayTitle,
    description,
  };
}
