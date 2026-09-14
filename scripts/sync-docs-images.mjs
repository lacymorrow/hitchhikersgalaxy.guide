#!/usr/bin/env node
/*
 * Mirrors docs/images -> public/docs/images.
 *
 * Docs reference screenshots as `/docs/images/foo.jpg`, an absolute URL that
 * only resolves if the file is served from public/. Keeping the originals in
 * docs/ means the Holocron provider (which reads ../docs) sees them too, so the
 * copy is generated rather than committed.
 */

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(repoRoot, "docs", "images");
const to = join(repoRoot, "public", "docs", "images");

if (!existsSync(from)) {
  console.log("[docs-images] no docs/images directory, nothing to sync");
  process.exit(0);
}

/*
 * Both providers serve these from their own public/ directory: Next.js from
 * public/docs/images, Holocron from docs-site/public/docs/images.
 */
const targets = [to, join(repoRoot, "docs-site", "public", "docs", "images")];

for (const target of targets) {
  mkdirSync(dirname(target), { recursive: true });
  cpSync(from, target, { recursive: true });
  console.log(`[docs-images] docs/images -> ${target.replace(`${repoRoot}/`, "")}`);
}
