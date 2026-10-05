#!/usr/bin/env node
/**
 * Supply-chain triage for Shipkit.
 *
 * `bun audit` reports every advisory against every path in the tree, which on a
 * 1600-package install is thousands of lines nobody reads. This ranks them by the
 * only two questions that decide whether you stop what you're doing:
 *
 *   1. Does the package ship to production, or does it only ever run on a laptop?
 *   2. Can the flaw be reached by someone who is not already inside?
 *
 * Reachability is computed by walking the real production closure: BFS from the
 * root package's `dependencies` through each installed package's own
 * `dependencies`, ignoring devDependencies. A package outside that set cannot
 * reach a user, whatever its CVSS says.
 *
 * Usage: bun audit --json > audit.json && node triage.mjs audit.json [rootDir]
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const auditPath = process.argv[2] ?? "audit.json";
const root = process.argv[3] ?? process.cwd();

// `bun audit` lists advisories for a package name without checking them against
// the version actually resolved in this tree, so it will report a Next.js 15
// advisory against a Next.js 16 install. Every finding is re-checked here.
const req = createRequire(join(root, "package.json"));
let semver = null;
try { semver = req("semver"); } catch { /* fall back to reporting unfiltered */ }

/** CWEs where the flaw hands an outsider access or execution. */
const EXPLOITABLE = new Set([
	// authn / authz bypass
	"CWE-287", "CWE-288", "CWE-284", "CWE-285", "CWE-862", "CWE-863",
	"CWE-306", "CWE-613", "CWE-384", "CWE-565",
	// normalization + confusion bugs that defeat identity checks
	"CWE-180", "CWE-178", "CWE-179",
	// injection / execution
	"CWE-94", "CWE-95", "CWE-77", "CWE-78", "CWE-79", "CWE-89", "CWE-91",
	"CWE-611", "CWE-502", "CWE-1321", "CWE-470",
	// traversal / forgery / disclosure
	"CWE-22", "CWE-23", "CWE-918", "CWE-200", "CWE-201", "CWE-532",
]);

/** CWEs that are real but only cost you availability. */
const DOS_ONLY = new Set(["CWE-400", "CWE-770", "CWE-674", "CWE-1333", "CWE-405"]);

const readJson = (p) => {
	try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
};

// ---- production closure -----------------------------------------------------

const rootPkg = readJson(join(root, "package.json")) ?? {};
const modules = join(root, "node_modules");

const resolvePkg = (name) => {
	const direct = join(modules, name, "package.json");
	return existsSync(direct) ? readJson(direct) : null;
};

const prodClosure = new Set();
const queue = Object.keys(rootPkg.dependencies ?? {});
while (queue.length) {
	const name = queue.shift();
	if (prodClosure.has(name)) continue;
	prodClosure.add(name);
	const pkg = resolvePkg(name);
	if (!pkg) continue;
	// Only runtime deps propagate. A dev dep of a dep never ships.
	for (const child of Object.keys(pkg.dependencies ?? {})) {
		if (!prodClosure.has(child)) queue.push(child);
	}
	// Optional deps do ship when present.
	for (const child of Object.keys(pkg.optionalDependencies ?? {})) {
		if (!prodClosure.has(child)) queue.push(child);
	}
}

const directDev = new Set(Object.keys(rootPkg.devDependencies ?? {}));

// ---- classify ---------------------------------------------------------------

const audit = readJson(auditPath) ?? {};
const rows = [];
const skipped = [];

const installedVersion = (name) => resolvePkg(name)?.version ?? null;

/** True when the resolved version really falls inside the advisory's range. */
const applies = (name, range) => {
	if (!semver || !range) return true; // cannot prove otherwise, so report it
	const v = installedVersion(name);
	if (!v) return true;
	try { return semver.satisfies(v, range, { includePrerelease: true }); }
	catch { return true; }
};

for (const [pkgName, advisories] of Object.entries(audit)) {
	if (!Array.isArray(advisories)) continue;
	const ships = prodClosure.has(pkgName);
	for (const a of advisories) {
		if (!applies(pkgName, a.vulnerable_versions)) {
			skipped.push(`${pkgName}@${installedVersion(pkgName)} not in ${a.vulnerable_versions}`);
			continue;
		}
		const cwes = a.cwe ?? [];
		const exploitable = cwes.some((c) => EXPLOITABLE.has(c));
		const dosOnly = cwes.length > 0 && cwes.every((c) => DOS_ONLY.has(c));
		const severe = a.severity === "critical" || a.severity === "high";

		let tier;
		if (ships && severe && exploitable) tier = 0;
		else if (ships && severe && !dosOnly) tier = 1;
		else if (ships && severe) tier = 2; // shipped but DoS-only
		else if (severe) tier = 2;          // dev-only, still worth a batch
		else tier = 3;

		rows.push({
			tier, pkg: pkgName, ships,
			direct: !!(rootPkg.dependencies?.[pkgName] || rootPkg.devDependencies?.[pkgName]),
			dev: directDev.has(pkgName),
			severity: a.severity,
			installed: installedVersion(pkgName),
			title: a.title ?? "",
			url: a.url ?? "",
			fixed: a.vulnerable_versions ?? "",
			cvss: a.cvss?.score || 0,
		});
	}
}

rows.sort((x, y) => x.tier - y.tier || y.cvss - x.cvss || x.pkg.localeCompare(y.pkg));

// ---- report -----------------------------------------------------------------

const LABEL = {
	0: "TIER 0  ships to production, reachable by an outsider  -> fix today",
	1: "TIER 1  ships to production                            -> fix this week",
	2: "TIER 2  dev-only, or availability-only                 -> monthly batch",
	3: "TIER 3  low / moderate                                 -> note only",
};

const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
for (const r of rows) counts[r.tier]++;

const asJson = process.argv.includes("--json");
if (asJson) {
	console.log(JSON.stringify({ counts, prodClosureSize: prodClosure.size, filtered: skipped.length, rows }, null, 2));
} else {
	console.log(`production closure: ${prodClosure.size} packages of ${existsSync(modules) ? "installed tree" : "(node_modules missing)"}`);
	if (!semver) console.log("WARNING: semver unavailable, advisories are NOT version-filtered");
	console.log(`applicable: ${rows.length}  |  T0 ${counts[0]}  T1 ${counts[1]}  T2 ${counts[2]}  T3 ${counts[3]}`);
	console.log(`filtered out ${skipped.length} advisories that do not match the installed version\n`);
	for (const tier of [0, 1, 2]) {
		const group = rows.filter((r) => r.tier === tier);
		if (!group.length) continue;
		console.log(LABEL[tier]);
		const seen = new Set();
		for (const r of group) {
			const key = `${r.pkg}|${r.title}`;
			if (seen.has(key)) continue;
			seen.add(key);
			const tag = r.direct ? (r.dev ? "direct/dev" : "direct") : "transitive";
			console.log(`  ${r.severity.padEnd(8)} ${r.pkg.padEnd(26)} ${String(r.installed ?? "?").padEnd(12)} ${tag.padEnd(11)} ${r.title.slice(0, 66)}`);
		}
		console.log("");
	}
}

process.exitCode = counts[0] > 0 ? 2 : 0;
