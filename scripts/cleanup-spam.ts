/**
 * One-time script to delete spam entries from the database
 * Run with: npx tsx scripts/cleanup-spam.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql, ilike } from "drizzle-orm";
import {
	pgTableCreator,
	serial,
	text,
	integer,
	timestamp,
	varchar,
	index,
} from "drizzle-orm/pg-core";

// Recreate minimal schema for the script
const DB_PREFIX = process.env.DB_PREFIX ?? "db";
const createTable = pgTableCreator((name) => `${DB_PREFIX}_${name}`);

const guideEntries = createTable(
	"guide_entry",
	{
		id: serial("id").primaryKey(),
		searchTerm: text("search_term").notNull(),
		content: text("content").notNull(),
	}
);

// Create DB connection
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error("DATABASE_URL not set");
	process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

const SPAM_PATTERNS = [
	// File extensions (normalized - dots removed)
	"%php",
	"%asp",
	"%aspx",
	"%jsp",
	"%cgi",
	"%env",
	"%bak",
	"%ini",
	// WordPress / CMS probes
	"wp-%",
	"wp%",
	"%wordpress%",
	"%wpadmin%",
	"%wpcontent%",
	"%wpincludes%",
	"%wplogin%",
	"%xmlrpc%",
	"%phpmyadmin%",
	"%adminer%",
	// Path traversal / system files
	"%etcpasswd%",
	"%etcshadow%",
	"%passwd%",
	// Common attack patterns
	"%webshell%",
	"%c99%",
	"%r57%",
	"%cmdexe%",
	"%powershell%",
];

async function main() {
	console.log("🔍 Counting spam entries...\n");

	// Count entries matching each pattern
	let totalToDelete = 0;
	const patternCounts: { pattern: string; count: number }[] = [];

	for (const pattern of SPAM_PATTERNS) {
		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(guideEntries)
			.where(ilike(guideEntries.searchTerm, pattern));

		const count = Number(result[0]?.count ?? 0);
		if (count > 0) {
			patternCounts.push({ pattern, count });
			totalToDelete += count;
		}
	}

	// Also count entries ending with specific patterns using regex-like matching
	const endingPatterns = [
		{ name: "ends with 'php'", sql: sql`${guideEntries.searchTerm} ~ 'php$'` },
		{ name: "ends with 'asp'", sql: sql`${guideEntries.searchTerm} ~ 'aspx?$'` },
		{ name: "ends with 'jsp'", sql: sql`${guideEntries.searchTerm} ~ 'jsp$'` },
		{ name: "ends with 'cgi'", sql: sql`${guideEntries.searchTerm} ~ 'cgi$'` },
		{ name: "ends with 'env'", sql: sql`${guideEntries.searchTerm} ~ 'env$'` },
		{ name: "ends with 'bak'", sql: sql`${guideEntries.searchTerm} ~ 'bak$'` },
		{ name: "ends with 'ini'", sql: sql`${guideEntries.searchTerm} ~ 'ini$'` },
		{ name: "starts with 'wp'", sql: sql`${guideEntries.searchTerm} ~ '^wp'` },
	];

	console.log("Pattern matches found:");
	console.log("─".repeat(50));

	for (const { pattern, count } of patternCounts) {
		console.log(`  ${pattern.padEnd(25)} ${count}`);
	}

	// Get total unique spam entries (using regex for accuracy)
	const spamResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(guideEntries)
		.where(
			sql`${guideEntries.searchTerm} ~ 'php$|aspx?$|jsp$|cgi$|bak$|ini$|^wp|phpmyadmin|xmlrpc|passwd|webshell'`
		);

	const uniqueSpamCount = Number(spamResult[0]?.count ?? 0);

	console.log("─".repeat(50));
	console.log(`\n📊 Total spam entries to delete: ${uniqueSpamCount}`);

	// Get total entries
	const totalResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(guideEntries);
	const totalEntries = Number(totalResult[0]?.count ?? 0);

	console.log(`📚 Total entries in database: ${totalEntries}`);
	console.log(`✨ Entries remaining after cleanup: ${totalEntries - uniqueSpamCount}\n`);

	// Show some examples of what will be deleted
	console.log("Sample entries to be deleted:");
	console.log("─".repeat(50));

	const samples = await db
		.select({ id: guideEntries.id, searchTerm: guideEntries.searchTerm })
		.from(guideEntries)
		.where(
			sql`${guideEntries.searchTerm} ~ 'php$|aspx?$|jsp$|cgi$|bak$|ini$|^wp|phpmyadmin|xmlrpc|passwd|webshell'`
		)
		.limit(10);

	for (const sample of samples) {
		console.log(`  [${sample.id}] ${sample.searchTerm}`);
	}
	console.log("  ...\n");

	// Prompt for confirmation
	const args = process.argv.slice(2);
	if (!args.includes("--confirm")) {
		console.log("⚠️  To actually delete these entries, run:");
		console.log("   npx tsx scripts/cleanup-spam.ts --confirm\n");
		process.exit(0);
	}

	// Delete spam entries
	console.log("🗑️  Deleting spam entries...");

	const deleteResult = await db
		.delete(guideEntries)
		.where(
			sql`${guideEntries.searchTerm} ~ 'php$|aspx?$|jsp$|cgi$|bak$|ini$|^wp|phpmyadmin|xmlrpc|passwd|webshell'`
		);

	console.log(`✅ Deleted spam entries successfully!`);

	// Verify
	const remainingResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(guideEntries);
	const remaining = Number(remainingResult[0]?.count ?? 0);

	console.log(`📚 Entries remaining: ${remaining}\n`);
}

main().catch(console.error);
