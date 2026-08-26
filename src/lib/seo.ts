/**
 * SEO helpers for guide entry pages.
 *
 * Google truncates SERP titles around 60 characters and descriptions around
 * 160; Ahrefs flags anything longer (LAC-3514 flagged 41 overlong titles
 * produced by the previous `<term> - The Hitchhiker's Guide | <42-char site
 * name>` template output).
 */

/** Short brand used in page titles; the full site name is too long for SERPs. */
export const SEO_TITLE_BRAND = "The Hitchhiker's Guide";

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
