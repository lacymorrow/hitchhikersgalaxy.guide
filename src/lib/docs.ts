import type { Node } from "fumadocs-core/page-tree";
import { loader } from "fumadocs-core/source";
import { docs } from "@/.source/server";

/*
 * Documentation content source.
 *
 * Content lives in /docs as MDX and is compiled by fumadocs-mdx (see
 * source.config.ts). This module is the single entry point the /docs route,
 * sidebar, and search API read from.
 *
 * Only the *headless* half of fumadocs is used — `fumadocs-core` for the page
 * tree, slugs, and search index. Rendering stays on Shipkit's own components
 * because `fumadocs-ui` requires Tailwind v4 and Shipkit is on v3.
 */
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});

export type DocPage = NonNullable<ReturnType<typeof source.getPage>>;

export interface NavItem {
  title: string;
  href: string;
  external?: boolean;
  description?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/** Section that collects top-level pages that aren't inside a folder. */
const ROOT_SECTION_TITLE = "Overview";

/** Page tree names are ReactNode; in practice fumadocs emits plain strings. */
function nodeName(name: unknown): string {
  if (typeof name === "string") return name;
  if (typeof name === "number") return String(name);
  return "";
}

/*
 * Flatten a page-tree branch into links.
 *
 * The docs sidebar renders a fixed two-level accordion (section -> links), so
 * folders nested deeper than one level are flattened into their parent section
 * rather than dropped.
 */
function collectPages(nodes: Node[]): NavItem[] {
  const items: NavItem[] = [];

  for (const node of nodes) {
    if (node.type === "page") {
      items.push({
        title: nodeName(node.name),
        href: node.url,
        ...(node.external === undefined ? {} : { external: node.external }),
      });
      continue;
    }

    if (node.type === "folder") {
      if (node.index) {
        items.push({ title: nodeName(node.index.name), href: node.index.url });
      }
      items.push(...collectPages(node.children));
    }
  }

  return items;
}

/** Sidebar navigation derived from the fumadocs page tree. */
export function getDocsNavigation(): NavSection[] {
  const tree = source.pageTree;
  const sections: NavSection[] = [];
  const rootItems: NavItem[] = [];

  for (const node of tree.children) {
    if (node.type === "folder") {
      sections.push({ title: nodeName(node.name), items: collectPages([node]) });
    } else if (node.type === "page") {
      rootItems.push({ title: nodeName(node.name), href: node.url });
    }
  }

  if (rootItems.length > 0) {
    sections.unshift({ title: ROOT_SECTION_TITLE, items: rootItems });
  }

  return sections;
}

/** @deprecated Use {@link getDocsNavigation}. Kept for existing imports. */
export const getDocNavigation = getDocsNavigation;

/** Every doc's slug segments, for `generateStaticParams`. */
export function getAllDocSlugs(): string[][] {
  return source.getPages().map((page) => page.slugs);
}

export async function getDocFromParams(paramsPromise: Promise<{ slug?: string[] }>) {
  const { slug } = await paramsPromise;
  return source.getPage(slug);
}

export interface DocSearchResult {
  title: string;
  content: string;
  url: string;
}

/*
 * Keyword search over the fumadocs search index.
 *
 * Deliberately dependency-free: results feed the AI answer in
 * /api/docs/search, which only needs a handful of relevant passages rather
 * than a ranked full-text engine.
 */
export function searchDocs(query: string, limit = 5): DocSearchResult[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 1);

  if (terms.length === 0) return [];

  const scored = source.getPages().flatMap((page) => {
    const title = page.data.title ?? "";
    const body = page.data.structuredData.contents.map((entry) => entry.content).join("\n");
    const haystack = `${title}\n${page.data.description ?? ""}\n${body}`.toLowerCase();

    // Title hits outrank body hits so the AI prompt leads with the right page.
    const score = terms.reduce((total, term) => {
      if (!haystack.includes(term)) return total;
      return total + (title.toLowerCase().includes(term) ? 3 : 1);
    }, 0);

    return score === 0 ? [] : [{ score, result: { title, content: body, url: page.url } }];
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.result);
}
