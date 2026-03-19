#!/usr/bin/env tsx

/**
 * Rebranding Script
 *
 * Updates site configuration with new branding information.
 * Modifies site-config.ts, .env.example, and package.json.
 *
 * Usage:
 *   bunx tsx scripts/rebrand.ts --name "MyApp" --domain "myapp.com"
 *   bunx tsx scripts/rebrand.ts --name "MyApp" --slug "myapp" --domain "myapp.com" --dry-run
 *
 * Options:
 *   --dry-run: Preview changes without writing to files
 *
 * All arguments are optional. If not provided, the script will prompt for them.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";

// Parse command line arguments
const args = process.argv.slice(2);
const argMap: Record<string, string> = {};
const flags: Record<string, boolean> = {};

for (let i = 0; i < args.length; i++) {
	if (args[i] && args[i]!.startsWith("--")) {
		const arg = args[i]!.substring(2);
		if (i + 1 >= args.length || (args[i + 1] && args[i + 1]!.startsWith("--"))) {
			flags[arg] = true;
		} else if (args[i + 1]) {
			argMap[arg] = args[i + 1]!;
			i++;
		}
	}
}

const isDryRun = flags["dry-run"] || false;

// Only create readline when we actually need to prompt
const needsPrompt = !argMap.name || !argMap.slug || !argMap.domain;
let rl: readline.Interface | null = null;

if (needsPrompt) {
	rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
}

const prompt = (question: string, defaultValue?: string): Promise<string> => {
	if (!rl) {
		return Promise.resolve(defaultValue || "");
	}
	return new Promise((resolve) => {
		rl!.question(
			question + (defaultValue ? " (default: " + defaultValue + ")" : "") + ": ",
			(answer) => {
				resolve(answer || defaultValue || "");
			},
		);
	});
};

// Helper: build a line of TypeScript source like:   key: "value",
function tsLine(indent: string, key: string, value: string): string {
	return "\n" + indent + key + ': "' + value + '",';
}

// Match a top-level section like `\n\tkey: {\n...\n\t},` handling nested braces
// by counting depth instead of using non-greedy [\s\S]*? which stops at inner `},`
function sectionPattern(key: string): RegExp {
	// Match key: { ... }, where the closing }, is at the same indent level (\t)
	// We look for \n\t}, that isn't preceded by deeper indentation
	return new RegExp("\\n\\t" + key + ": \\{[\\s\\S]*?\\n\\t\\},");
}

// Backtick as a runtime value so esbuild never sees an unmatched literal
const BACKTICK = String.fromCharCode(96);

async function main() {
	console.log("Rebranding Script");
	console.log("====================");
	console.log("This script will update your site configuration with new branding information.");
	if (isDryRun) {
		console.log("\nDRY RUN MODE: No files will be modified");
	}
	console.log("");

	// Gather inputs
	const projectName = argMap.name || (await prompt("Project Name", "Shipkit"));
	const projectSlug =
		argMap.slug ||
		(await prompt("Project Slug", projectName.toLowerCase().replace(/\s+/g, "-")));
	const domain = argMap.domain || (await prompt("Domain", projectSlug + ".com"));
	const creatorName =
		argMap["creator-name"] || (needsPrompt ? await prompt("Your Name (optional)", "") : "");

	// Done prompting - close readline immediately
	if (rl) {
		rl.close();
		rl = null;
	}

	// Derive values
	const githubOrg = projectSlug + "-org";
	const githubRepo = projectSlug;
	const creatorUsername = creatorName ? creatorName.toLowerCase().replace(/\s+/g, "") : projectSlug;
	const creatorEmail = "hello@" + domain;
	const creatorDomain = creatorName ? creatorUsername + ".com" : domain;
	const creatorTwitter = creatorUsername;
	const databaseName = projectSlug;
	const vercelProjectName = projectSlug + "-app";
	const bonesName = "Bones";
	const brainsName = "Brains";

	// ── Update site-config.ts ──
	console.log("\nUpdating site configuration...");

	const siteConfigPath = path.join(process.cwd(), "src", "config", "site-config.ts");
	let siteConfig = fs.readFileSync(siteConfigPath, "utf8");

	const siteConfigStartPattern = /export const siteConfig: SiteConfig = \{/;
	const siteConfigMatch = siteConfigStartPattern.exec(siteConfig);

	if (!siteConfigMatch) {
		console.error("Could not find siteConfig export in site-config.ts");
		process.exit(1);
	}

	const siteConfigStart = siteConfigMatch.index;
	const beforeConfig = siteConfig.substring(0, siteConfigStart + siteConfigMatch[0].length);
	let afterConfig = siteConfig.substring(siteConfigStart + siteConfigMatch[0].length);

	// Simple key replacements
	afterConfig = afterConfig.replace(
		/\n\s*name: "([^"]+)"/,
		'\n\tname: "' + projectName + '"',
	);
	afterConfig = afterConfig.replace(
		/\n\s*url: "([^"]+)"/,
		'\n\turl: "https://' + domain + '"',
	);
	afterConfig = afterConfig.replace(
		/\n\s*ogImage: "([^"]+)"/,
		'\n\togImage: "https://' + domain + '/og"',
	);

	// Branding section
	const brandingPattern = sectionPattern("branding");
	const newBranding =
		"\n\tbranding: {" +
		tsLine("\t\t", "projectName", projectName) +
		tsLine("\t\t", "projectSlug", projectSlug) +
		"\n\t\tproductNames: {" +
		tsLine("\t\t\t", "bones", bonesName) +
		tsLine("\t\t\t", "brains", brainsName) +
		tsLine("\t\t\t", "main", projectName) +
		"\n\t\t}," +
		tsLine("\t\t", "domain", domain) +
		tsLine("\t\t", "protocol", "web+" + projectSlug) +
		tsLine("\t\t", "githubOrg", githubOrg) +
		tsLine("\t\t", "githubRepo", githubRepo) +
		tsLine("\t\t", "vercelProjectName", vercelProjectName) +
		tsLine("\t\t", "databaseName", databaseName) +
		"\n\t},";
	afterConfig = afterConfig.replace(brandingPattern, newBranding);

	// Repository section (needs backtick template literals in output)
	const repoPattern = sectionPattern("repo");
	const cloneUrl = "https://github.com/" + githubOrg + "/" + githubRepo + ".git";
	const sshUrl = "git@github.com:" + githubOrg + "/" + githubRepo + ".git";
	const newRepo =
		"\n\trepo: {" +
		tsLine("\t\t", "owner", githubOrg) +
		tsLine("\t\t", "name", githubRepo) +
		tsLine("\t\t", "url", "https://github.com/" + githubOrg + "/" + githubRepo) +
		"\n\t\tformat: {" +
		"\n\t\t\tclone: () => " + BACKTICK + cloneUrl + BACKTICK + "," +
		"\n\t\t\tssh: () => " + BACKTICK + sshUrl + BACKTICK + "," +
		"\n\t\t}" +
		"\n\t},";
	afterConfig = afterConfig.replace(repoPattern, newRepo);

	// Email section (format generates address string, not a self-reference)
	const emailPattern = sectionPattern("email");
	const newEmail =
		"\n\temail: {" +
		tsLine("\t\t", "support", "support@" + domain) +
		tsLine("\t\t", "team", "team@" + domain) +
		tsLine("\t\t", "noreply", "noreply@" + domain) +
		tsLine("\t\t", "domain", domain) +
		tsLine("\t\t", "legal", "legal@" + domain) +
		tsLine("\t\t", "privacy", "privacy@" + domain) +
		"\n\t\tformat: (type: string) => " + BACKTICK + "${type}@" + domain + BACKTICK + "," +
		"\n\t},";
	afterConfig = afterConfig.replace(emailPattern, newEmail);

	// Creator section (avatar derived from GitHub username, not hardcoded)
	const creatorPattern = sectionPattern("creator");
	const creatorAvatar = creatorName
		? "https://github.com/" + creatorUsername + ".png"
		: "https://" + domain + "/icon.png";
	const creatorFullName = creatorName || projectName + " Team";
	const newCreator =
		"\n\tcreator: {" +
		tsLine("\t\t", "name", creatorUsername) +
		tsLine("\t\t", "email", creatorEmail) +
		tsLine("\t\t", "url", "https://" + creatorDomain) +
		tsLine("\t\t", "twitter", "@" + creatorTwitter) +
		tsLine("\t\t", "twitter_handle", creatorTwitter) +
		tsLine("\t\t", "domain", creatorDomain) +
		tsLine("\t\t", "fullName", creatorFullName) +
		tsLine("\t\t", "role", "Developer") +
		tsLine("\t\t", "avatar", creatorAvatar) +
		tsLine("\t\t", "location", "") +
		tsLine("\t\t", "bio", "Creator and developer.") +
		"\n\t},";
	afterConfig = afterConfig.replace(creatorPattern, newCreator);

	// Keywords
	const keywordsPattern = /\n\s*keywords: \[\s*["\s\S]*?\n\s*\]/;
	const newKeywords =
		'\n\t\tkeywords: [\n\t\t\t"Next.js",\n\t\t\t"React",\n\t\t\t"Tailwind CSS",' +
		'\n\t\t\t"Server Components",\n\t\t\t"' + projectName + '",' +
		'\n\t\t\t"Shadcn",\n\t\t\t"UI Components",\n\t\t]';
	afterConfig = afterConfig.replace(keywordsPattern, newKeywords);

	// Reassemble
	siteConfig = beforeConfig + afterConfig;

	// ── Update .env.example ──
	const envExamplePath = path.join(process.cwd(), ".env.example");
	let envExample = fs.readFileSync(envExamplePath, "utf8");
	envExample = envExample.replace(
		/DATABASE_URL="postgresql:\/\/postgres:password@localhost:5432\/([^"]+)"/,
		'DATABASE_URL="postgresql://postgres:password@localhost:5432/' + databaseName + '"',
	);

	// ── Update package.json ──
	const packageJsonPath = path.join(process.cwd(), "package.json");
	let packageJson = fs.readFileSync(packageJsonPath, "utf8");
	packageJson = packageJson.replace(
		/"name":\s*"([^"]+)"/,
		'"name": "' + projectSlug + '"',
	);

	// ── Output ──
	if (isDryRun) {
		console.log("\nChanges that would be made:");
		console.log("\n1. src/config/site-config.ts:");
		console.log("  - Project name: Shipkit -> " + projectName);
		console.log("  - Domain: shipkit.io -> " + domain);
		console.log("  - GitHub: lacymorrow/shipkit -> " + githubOrg + "/" + githubRepo);
		console.log("  - Creator: Lacy Morrow -> " + creatorFullName);

		console.log("\n2. .env.example:");
		console.log("  - Database name: shipkit -> " + databaseName);

		console.log("\n3. package.json:");
		console.log("  - Package name: ship-kit -> " + projectSlug);

		console.log("\nNo files were modified (dry run)");
	} else {
		fs.writeFileSync(siteConfigPath, siteConfig);
		console.log("Updated src/config/site-config.ts");

		fs.writeFileSync(envExamplePath, envExample);
		console.log("Updated .env.example");

		fs.writeFileSync(packageJsonPath, packageJson);
		console.log("Updated package.json");

		console.log("\nFormatting files...");
		try {
			execSync('bunx eslint --fix src/config/site-config.ts || echo "Formatting skipped"', {
				stdio: "inherit",
			});
		} catch {
			// eslint errors are non-fatal
		}
	}

	console.log("\nRebranding complete!");
	console.log("Your project has been " + (isDryRun ? "prepared to be " : "") + "rebranded to " + projectName + ".");

	if (!isDryRun) {
		console.log("\nNext steps:");
		console.log("1. Review the changes in src/config/site-config.ts");
		console.log("2. Update your .env file with the new database name");
		console.log("3. Restart your development server");
	} else {
		console.log("\nTo apply these changes, run the script without the --dry-run flag.");
	}

	process.exit(0);
}

main().catch((error) => {
	console.error("Error:", error);
	if (rl) rl.close();
	process.exit(1);
});
