#!/usr/bin/env bun
/**
 * Proof-of-work verification script for AI agents.
 * Runs all verification gates and outputs a structured report.
 *
 * Usage:
 *   bun run verify          # Run all gates
 *   bun run verify --quick  # Skip build gate
 */

import { execSync } from "node:child_process";

interface GateResult {
	name: string;
	command: string;
	passed: boolean;
	output: string;
	durationMs: number;
}

function runGate(name: string, command: string): GateResult {
	const start = Date.now();
	try {
		const output = execSync(command, {
			encoding: "utf-8",
			timeout: 600_000,
			stdio: ["pipe", "pipe", "pipe"],
		});
		return {
			name,
			command,
			passed: true,
			output: output.trim().slice(-500),
			durationMs: Date.now() - start,
		};
	} catch (error) {
		const err = error as { stderr?: string; stdout?: string };
		return {
			name,
			command,
			passed: false,
			output: (err.stderr || err.stdout || "Unknown error").trim().slice(-500),
			durationMs: Date.now() - start,
		};
	}
}

const quick = process.argv.includes("--quick");

const gates: Array<{ name: string; command: string; skip?: boolean }> = [
	{ name: "typecheck", command: "bun run typecheck" },
	{ name: "lint", command: "bun run lint" },
	{ name: "test", command: "bun run test" },
	{ name: "build", command: "bun run build", skip: quick },
];

console.log("## Verification Report\n");

const results: GateResult[] = [];
let allPassed = true;

for (const gate of gates) {
	if (gate.skip) {
		console.log(`- ${gate.name}: SKIPPED`);
		continue;
	}

	process.stdout.write(`- ${gate.name}: `);
	const result = runGate(gate.name, gate.command);
	results.push(result);

	if (result.passed) {
		console.log(`PASS (${(result.durationMs / 1000).toFixed(1)}s)`);
	} else {
		console.log(`FAIL (${(result.durationMs / 1000).toFixed(1)}s)`);
		allPassed = false;
	}
}

console.log("");

if (!allPassed) {
	console.log("### Failures\n");
	for (const result of results) {
		if (!result.passed) {
			console.log(`#### ${result.name}`);
			console.log(`\`\`\`\n${result.output}\n\`\`\`\n`);
		}
	}
}

console.log(allPassed ? "**Result: ALL GATES PASSED**" : "**Result: VERIFICATION FAILED**");
process.exit(allPassed ? 0 : 1);
