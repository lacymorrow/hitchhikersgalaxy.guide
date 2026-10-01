#!/usr/bin/env bun
/**
 * Registry closure check.
 *
 * For every item in registry.json, follow the `@/...` and relative imports of its
 * files and report each source file that is reachable but is not:
 *   - shipped by the item,
 *   - shipped by one of its @shipkit registryDependencies (transitively), or
 *   - already present in Bones (the target project).
 * Those files would be missing after `npx shadcn add @shipkit/<item>` in a fresh
 * Bones project, so the install would not typecheck.
 *
 *   bun scripts/registry-closure.ts            # all items
 *   bun scripts/registry-closure.ts caching     # one item, verbose
 *   BONES_DIR=~/repo/bones bun scripts/...      # local Bones checkout (default: fetch tree from GitHub)
 *   BONES_REF=lac/bones-seams                   # ref inside BONES_DIR to compare against (default origin/main)
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

interface Item {
  name: string;
  files: { path: string }[];
  registryDependencies?: string[];
}

const root = resolve(import.meta.dir, "..");
const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8")) as { items: Item[] };
const items = new Map(registry.items.map((i) => [i.name, i]));
const only = process.argv.slice(2);

async function bonesFiles(): Promise<Set<string>> {
  const dir = process.env.BONES_DIR;
  if (dir) {
    const ref = process.env.BONES_REF ?? "origin/main";
    const out = await Bun.$`git -C ${dir} ls-tree -r ${ref} --name-only`.text();
    return new Set(out.split("\n").filter(Boolean));
  }
  const out =
    await Bun.$`gh api repos/shipkit-io/bones/git/trees/main?recursive=1 --jq '.tree[].path'`.text();
  return new Set(out.split("\n").filter(Boolean));
}

const exts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".json"];
function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join("src", spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../")) base = join(dirname(from), spec);
  else if (spec === "@payload-config") base = "src/payload.config";
  else return null; // npm package
  const candidates = [
    base,
    ...exts.map((e) => base + e),
    ...exts.map((e) => join(base, "index" + e)),
  ];
  for (const c of candidates) {
    const full = join(root, c);
    if (existsSync(full) && statSync(full).isFile()) return c;
  }
  return null;
}

const importRe =
  /(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s*["']([^"']+)["']/g;
function importsOf(file: string): string[] {
  const src = readFileSync(join(root, file), "utf8");
  const specs: string[] = [];
  for (const m of src.matchAll(importRe)) specs.push(m[1] ?? m[2] ?? m[3]);
  return specs;
}

function closure(files: string[], stopAt: Set<string>): Set<string> {
  const seen = new Set<string>();
  const queue = [...files];
  while (queue.length) {
    const f = queue.pop()!;
    if (seen.has(f) || !existsSync(join(root, f))) continue;
    seen.add(f);
    // A file Bones already has is Bones' responsibility, imports and all.
    if (stopAt.has(f) && !files.includes(f)) continue;
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(f)) continue;
    for (const spec of importsOf(f)) {
      const r = resolveImport(f, spec);
      if (r && !seen.has(r)) queue.push(r);
    }
  }
  return seen;
}

function shippedBy(
  name: string,
  acc = new Set<string>(),
  visited = new Set<string>()
): Set<string> {
  if (visited.has(name)) return acc;
  visited.add(name);
  const item = items.get(name);
  if (!item) return acc;
  for (const f of item.files) acc.add(f.path);
  for (const dep of item.registryDependencies ?? []) {
    if (dep.startsWith("@shipkit/")) shippedBy(dep.slice("@shipkit/".length), acc, visited);
  }
  return acc;
}

const bones = await bonesFiles();
const need = new Map<string, string[]>();
let failures = 0;
for (const item of registry.items) {
  if (only.length && !only.includes(item.name)) continue;
  const own = shippedBy(item.name);
  const reach = closure(
    item.files.map((f) => f.path),
    bones
  );
  const missing = [...reach].filter((f) => !own.has(f) && !bones.has(f)).sort();
  const inBones = [...reach].filter((f) => !own.has(f) && bones.has(f)).length;
  for (const f of missing) need.set(f, [...(need.get(f) ?? []), item.name]);
  if (missing.length) {
    failures++;
    console.log(
      `\n${item.name}: ${missing.length} reachable file(s) neither shipped nor in Bones (${inBones} rely on Bones)`
    );
    for (const f of missing) console.log(`  ${f}`);
  } else if (only.length) {
    console.log(`${item.name}: closure ok (${reach.size} files, ${inBones} provided by Bones)`);
  }
}
if (!only.length && failures) {
  const sorted = [...need.entries()].sort((a, b) => b[1].length - a[1].length);
  console.log("\nMost-needed files (candidates for Bones core or a shared item):");
  for (const [f, who] of sorted.slice(0, 40))
    console.log(`  ${String(who.length).padStart(2)}  ${f}`);
}
console.log(
  `\n${failures ? `${failures} item(s) incomplete` : "every item's closure is shipped or in Bones"}`
);
process.exit(failures ? 1 : 0);
