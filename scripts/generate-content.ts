/**
 * Content pre-generation script
 *
 * This script pre-generates content for a list of keywords during build time.
 * This ensures that high-value pages are available immediately without waiting for
 * on-demand generation.
 *
 * Usage:
 * - Run directly: `npx tsx scripts/generate-content.ts`
 * - Run via package.json script: `pnpm generate-content`
 *
 * In production, this script would be run:
 * 1. As part of the build process (CI/CD)
 * 2. On a schedule to generate content for trending keywords
 * 3. When new keywords are added to the target list
 */

import * as fs from "fs";
import * as path from "path";
import { preGenerateContent, _exportDatabase } from "../src/server/services/content-generation";

// In a real implementation, these keywords would come from:
// - A database of high-value target keywords
// - Search analytics data
// - Marketing team input
// - Competitor research
const TARGET_KEYWORDS = [
	"digital-marketing",
	"seo-strategies",
	"content-marketing",
	"local-seo",
	"social-media-marketing",
	"search-engine-optimization",
	"keyword-research",
	"mobile-optimization",
	"link-building",
	"analytics-tools",
];

async function main() {
	console.log("Content Pre-Generation Script");
	console.log("============================");

	try {
		// Pre-generate content for all target keywords
		console.log(`Pre-generating content for ${TARGET_KEYWORDS.length} target keywords`);

		// Track timing
		const startTime = Date.now();

		// Generate content
		await preGenerateContent(TARGET_KEYWORDS);

		// Calculate timing
		const duration = (Date.now() - startTime) / 1000;
		console.log(`Content generation completed in ${duration.toFixed(2)} seconds`);

		// In a production environment, we would:
		// 1. Store the generated content in a database
		// 2. Update the sitemap with the new URLs
		// 3. Potentially trigger builds for the newly generated pages

		// For demo purposes, export the in-memory database to a JSON file
		const outputDir = path.join(process.cwd(), "data");

		// Create the data directory if it doesn't exist
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		// Export the database to a JSON file
		const exportedData = _exportDatabase();
		fs.writeFileSync(
			path.join(outputDir, "generated-content.json"),
			JSON.stringify(exportedData, null, 2)
		);

		console.log(`Successfully exported generated content to data/generated-content.json`);
		console.log(`Generated pages:`);

		// List the generated pages
		Object.keys(exportedData).forEach((slug, index) => {
			console.log(`${index + 1}. /${slug}`);
		});

		process.exit(0);
	} catch (error) {
		console.error("Error in content generation:", error);
		process.exit(1);
	}
}

// Run the main function
main().catch(console.error);
