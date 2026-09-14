#!/usr/bin/env node
/*
 * Generates docs-site/docs.jsonc from the canonical MDX tree in /docs.
 *
 * The Holocron provider shares Shipkit's content (see docs-site/vite.config.ts,
 * `pagesDir: "../docs"`), so its navigation must be derived from the same files
 * the fumadocs page tree is built from. Running this on every docs-site dev/build
 * keeps the two providers from drifting.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = join(repoRoot, "docs");
const outFile = join(repoRoot, "docs-site", "docs.jsonc");

const PAGE_EXTENSIONS = [".md", ".mdx"];
const ROOT_GROUP = "Overview";

function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...walk(full));
    } else if (PAGE_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      found.push(full);
    }
  }
  return found;
}

/** "getting-started" -> "Getting Started" */
function humanize(segment) {
  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function titleOf(file, slug) {
  const source = readFileSync(file, "utf8");
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  const title = frontmatter && /^title:\s*(.+)$/m.exec(frontmatter[1]);
  if (title) return title[1].trim().replace(/^["']|["']$/g, "");
  const heading = /^#\s+(.+)$/m.exec(source);
  return heading ? heading[1].trim() : humanize(slug.split("/").pop());
}

const pages = walk(docsDir)
  .map((file) => {
    const slug = relative(docsDir, file).replace(/\.(md|mdx)$/, "");
    const [head, ...rest] = slug.split("/");
    return {
      slug,
      title: titleOf(file, slug),
      group: rest.length === 0 ? ROOT_GROUP : humanize(head),
      isIndex: slug === "index" || slug.endsWith("/index"),
    };
  })
  .sort((a, b) => {
    // index pages lead their group; everything else alphabetical by title
    if (a.isIndex !== b.isIndex) return a.isIndex ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

const groups = [];
for (const page of pages) {
  let group = groups.find((candidate) => candidate.group === page.group);
  if (!group) {
    group = { group: page.group, pages: [] };
    groups.push(group);
  }
  group.pages.push(page.slug);
}

// Overview (root-level pages) first, then folders alphabetically.
groups.sort((a, b) => {
  if (a.group === ROOT_GROUP) return -1;
  if (b.group === ROOT_GROUP) return 1;
  return a.group.localeCompare(b.group);
});

/*
 * Docs are written with absolute /docs/... links because the fumadocs provider
 * mounts at /docs. Holocron serves from its own root and is proxied back under
 * /docs by next.config.ts, so those links resolve correctly in the browser —
 * Holocron's build-time checker just can't see the proxy prefix. Declaring them
 * as knownPaths keeps real broken links reportable instead of drowning in 131
 * false positives.
 */
const knownPaths = [
  "/docs",
  ...pages.flatMap((page) => {
    const paths = [`/docs/${page.slug}`];
    // fumadocs maps foo/index.mdx to /docs/foo, so the directory form is a real
    // URL that content links to and must be declared too.
    if (page.isIndex) paths.push(`/docs/${page.slug.replace(/\/?index$/, "")}`);
    return paths;
  }),
].filter((path) => path !== "/docs/");

const config = {
  $schema: "https://holocron.so/docs.json",
  knownPaths,
  name: "Shipkit",
  favicon: "/favicon.ico",
  colors: { primary: "#6366f1" },
  icons: { library: "lucide" },
  navbar: {
    links: [{ type: "github", href: "https://github.com/lacymorrow/shipkit" }],
    primary: { type: "button", label: "Get Started", href: "/getting-started" },
  },
  footer: {
    socials: { github: "https://github.com/lacymorrow/shipkit" },
  },
  navigation: {
    tabs: [{ tab: "Documentation", groups }],
  },
};

const banner = [
  "// GENERATED FILE — do not edit.",
  "// Source: /docs  ·  Generator: scripts/generate-holocron-nav.mjs",
  "",
].join("\n");

writeFileSync(outFile, banner + JSON.stringify(config, null, 2) + "\n");

const total = groups.reduce((sum, group) => sum + group.pages.length, 0);
console.log(
  `[holocron-nav] ${total} pages across ${groups.length} groups -> ${relative(repoRoot, outFile)}`
);
