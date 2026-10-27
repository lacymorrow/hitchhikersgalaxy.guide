import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A `loading.tsx` wraps its segment's page and every segment below it in a
 * Suspense boundary. When a page under that boundary awaits data and then
 * calls `notFound()`, Next.js has already streamed the shell with HTTP 200, so
 * the visitor gets a not-found body with a 200 status: a soft 404. Crawlers
 * index it, and the not-found render can throw React #419 on the client.
 *
 * An in-page `<Suspense>` does the same thing when it wraps the component that
 * decides the status rather than a slow part beside it. That is how the guide
 * slug route served HTTP 200 with a "Don't Panic" 404 body and two competing
 * robots tags, which turned ~309 indexed entries noindex (LAC-5888).
 *
 * Rules, checked per page that calls `notFound()`:
 * 1. No `loading.*` in any ancestor folder. An ancestor's boundary also wraps
 *    this segment's layout, so nothing above can decide the status first.
 * 2. A `loading.*` in the page's own folder is allowed only when a sibling
 *    `layout.tsx` calls `notFound()`. The layout renders above the boundary,
 *    so it settles the status and the page keeps its skeleton.
 * 3. No component rendered inside an in-page `<Suspense>` may call
 *    `notFound()`. Decide the status in the page or layout body, above the
 *    boundary, and suspend only on work whose outcome the status does not
 *    depend on.
 *
 * Want a skeleton on a page that can 404? Put the existence check in that
 * segment's layout (see changelog/[...slug]/layout.tsx), or use an in-page
 * <Suspense> around a slow part that cannot 404 (see the related-entries list
 * in (guide)/[slug]/page.tsx).
 */
const APP_DIR = join(process.cwd(), "src", "app");
const SRC_DIR = join(process.cwd(), "src");
const LOADING_FILES = ["loading.tsx", "loading.ts", "loading.jsx", "loading.js"];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/^page\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const callsNotFound = (file: string) => /\bnotFound\(\)/.test(readFileSync(file, "utf8"));

const loadingFilesIn = (dir: string) =>
  LOADING_FILES.map((f) => join(dir, f)).filter((f) => existsSync(f));

const notFoundPages = walk(APP_DIR).filter(callsNotFound);

/**
 * The JSX inside every non-self-closing `<Suspense>` in a source file, with
 * nested boundaries kept inside their parent's slice.
 */
/**
 * The `>` that closes an opening JSX tag, skipping any `>` nested in a prop
 * expression. `fallback={<Skeleton />}` carries its own `/>`, so taking the
 * first `>` reads every real boundary as self-closing and sees no children.
 */
function openingTagEnd(src: string, tagStart: number): number {
  let braces = 0;
  for (let i = tagStart; i < src.length; i += 1) {
    const char = src[i];
    if (char === "{") braces += 1;
    else if (char === "}") braces -= 1;
    else if (char === ">" && braces === 0) return i;
  }
  return -1;
}

function suspenseBodies(src: string): string[] {
  const bodies: string[] = [];
  const open = /<Suspense(?=[\s/>])/g;
  let match = open.exec(src);
  while (match !== null) {
    const tagEnd = openingTagEnd(src, match.index);
    // `<Suspense ... />` has no children to get wrong.
    if (tagEnd !== -1 && src[tagEnd - 1] !== "/") {
      let depth = 1;
      let cursor = tagEnd + 1;
      while (depth > 0 && cursor < src.length) {
        const nextOpen = src.indexOf("<Suspense", cursor);
        const nextClose = src.indexOf("</Suspense>", cursor);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth += 1;
          cursor = nextOpen + "<Suspense".length;
        } else {
          depth -= 1;
          if (depth === 0) bodies.push(src.slice(tagEnd + 1, nextClose));
          cursor = nextClose + "</Suspense>".length;
        }
      }
    }
    match = open.exec(src);
  }
  return bodies;
}

/** Capitalised JSX tags used in a chunk of JSX, which is to say its components. */
function componentTags(jsx: string): string[] {
  const tags = new Set<string>();
  for (const [, name] of jsx.matchAll(/<([A-Z][A-Za-z0-9_]*)/g)) {
    if (name !== "Suspense") tags.add(name);
  }
  return [...tags];
}

/**
 * The source of one top-level declaration, from its name to the next
 * declaration at column 0. Per-component rather than per-file on purpose: the
 * page body that correctly calls `notFound()` usually lives in the same file
 * as the component rendered under the boundary.
 */
function declarationSource(src: string, name: string): string | null {
  const start = new RegExp(
    String.raw`(?:^|\n)(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\s+${name}\s*[(<]|(?:const|let|var)\s+${name}\s*[:=])`
  ).exec(src);
  if (!start) return null;
  const from = start.index;
  const rest = src.slice(from + 1);
  const next =
    /\n(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s/.exec(
      rest
    );
  return next ? rest.slice(0, next.index) : rest;
}

const CANDIDATE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"];

/** Resolve a local import specifier to a file on disk. Bare packages are skipped. */
function resolveLocal(specifier: string, fromFile: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) base = join(SRC_DIR, specifier.slice(2));
  else if (specifier.startsWith(".")) base = join(dirname(fromFile), specifier);
  else return null;
  return CANDIDATE_EXTENSIONS.map((ext) => base + ext).find(existsSync) ?? null;
}

/** Where a JSX tag's component is declared: this file, or a local import. */
function definitionOf(
  tag: string,
  file: string,
  readSource: (f: string) => string
): { src: string; file: string } | null {
  const src = readSource(file);
  if (declarationSource(src, tag)) return { src, file };

  for (const [, clause, specifier] of src.matchAll(
    /import\s+([^;]*?)\s+from\s+["']([^"']+)["']/g
  )) {
    if (!new RegExp(String.raw`\b${tag}\b`).test(clause)) continue;
    const resolved = resolveLocal(specifier, file);
    if (resolved) return { src: readFileSync(resolved, "utf8"), file: resolved };
  }
  return null;
}

/**
 * Components rendered under an in-page `<Suspense>` that call `notFound()`.
 * One level deep: it catches the component the boundary exists to wrap, which
 * is where the awaiting-then-404 shape lives.
 */
function suspendedNotFoundCallers(
  file: string,
  readSource = (f: string) => readFileSync(f, "utf8")
): string[] {
  const src = readSource(file);
  const offenders: string[] = [];
  for (const body of suspenseBodies(src)) {
    for (const tag of componentTags(body)) {
      const definition = definitionOf(tag, file, readSource);
      if (!definition) continue;
      const declaration = declarationSource(definition.src, tag);
      if (declaration && /\bnotFound\(\)/.test(declaration)) offenders.push(tag);
    }
  }
  return offenders;
}

describe("no loading.tsx above a page that calls notFound()", () => {
  it("finds at least one page that can 404 (sanity)", () => {
    expect(notFoundPages.length).toBeGreaterThan(0);
  });

  it.each(notFoundPages.map((file) => [relative(APP_DIR, file), file]))(
    "%s: loading files above it cannot commit a 200 first",
    (_label, file) => {
      const pageDir = dirname(file);
      const offenders: string[] = [];

      // Own folder: allowed only if a sibling layout settles the 404 first.
      const layout = join(pageDir, "layout.tsx");
      const layoutSettles404 = existsSync(layout) && callsNotFound(layout);
      if (!layoutSettles404) offenders.push(...loadingFilesIn(pageDir));

      // Ancestors: never allowed.
      let dir = dirname(pageDir);
      while (dir.startsWith(APP_DIR)) {
        offenders.push(...loadingFilesIn(dir));
        if (dir === APP_DIR) break;
        dir = dirname(dir);
      }

      expect(offenders.map((f) => relative(APP_DIR, f))).toEqual([]);
    }
  );
});

describe("no in-page <Suspense> around a component that calls notFound()", () => {
  const suspenseFiles = walk(APP_DIR).filter((f) =>
    /<Suspense(?=[\s/>])/.test(readFileSync(f, "utf8"))
  );

  it("finds at least one page using <Suspense> (sanity)", () => {
    expect(suspenseFiles.length).toBeGreaterThan(0);
  });

  it.each(suspenseFiles.map((file) => [relative(APP_DIR, file), file]))(
    "%s: nothing under the boundary decides the status",
    (_label, file) => {
      expect(suspendedNotFoundCallers(file)).toEqual([]);
    }
  );

  // The shape that shipped, kept as a fixture so the detector above stays
  // honest when nobody is writing it wrong.
  it("flags the LAC-5888 shape", () => {
    const bad = `
async function GuideEntry({ slug }: { slug: string }) {
  const result = await searchGuide(slug, true);
  if (!result.success) {
    notFound();
  }
  return <article>{result.data.content}</article>;
}

export default async function GuidePage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <GuideEntry slug="towel" />
    </Suspense>
  );
}
`;
    expect(suspendedNotFoundCallers("fixture.tsx", () => bad)).toEqual(["GuideEntry"]);
  });

  it("allows a boundary around a sibling that cannot 404", () => {
    const good = `
async function Related() {
  const entries = await getRecentEntries(4);
  return <ul>{entries.map((e) => <li key={e.id}>{e.searchTerm}</li>)}</ul>;
}

export default async function GuidePage() {
  const result = await searchGuide("towel", true);
  if (!result.success) {
    notFound();
  }
  return (
    <Suspense fallback={<Skeleton />}>
      <Related />
    </Suspense>
  );
}
`;
    expect(suspendedNotFoundCallers("fixture.tsx", () => good)).toEqual([]);
  });
});
