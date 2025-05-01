/**
 * Script to test the white-label programmatic SEO platform
 *
 * This script generates test content for various keywords and validates the functionality.
 */

import { preGenerateContent, _exportDatabase } from "../src/server/services/content-generation";
import { getConfig } from "../src/app/(app)/[...slug]/config";
import fs from "fs";
import path from "path";

// Test keywords to generate content for
const TEST_KEYWORDS = [
	"seo-basics",
	"content-marketing",
	"keyword-research",
	"on-page-optimization",
	"backlink-strategies",
	"local-seo",
	"e-commerce-seo",
	"mobile-optimization",
	"voice-search-seo",
	"technical-seo",
];

async function runTest() {
	console.log("White-Label SEO Platform Test\n");
	console.log("Testing with keywords:", TEST_KEYWORDS);

	// Test content generation
	console.log("\n1. Testing content generation...");
	const startTime = Date.now();
	await preGenerateContent(TEST_KEYWORDS);
	const endTime = Date.now();

	console.log(`Content generation completed in ${(endTime - startTime) / 1000} seconds`);

	// Export the generated content database for inspection
	const database = _exportDatabase();
	console.log(`\n2. Generated content for ${Object.keys(database).length} keywords`);

	// Validate the content
	let validCount = 0;
	for (const keyword of TEST_KEYWORDS) {
		if (
			database[keyword] &&
			database[keyword].title &&
			database[keyword].body &&
			database[keyword].generatedAt
		) {
			validCount++;
		}
	}

	console.log(`Validation: ${validCount}/${TEST_KEYWORDS.length} keywords have valid content`);

	// Test white-label configuration
	console.log("\n3. Testing white-label configuration...");
	const defaultConfig = getConfig();
	const client1Config = getConfig("client1");

	console.log("Default branding:", defaultConfig.branding.brandingText);
	console.log("Client1 branding:", client1Config.branding.customFooterText || "N/A");

	// Save results for inspection
	const outputDir = path.join(process.cwd(), "test-results");
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	const resultsPath = path.join(outputDir, "seo-platform-test-results.json");
	fs.writeFileSync(
		resultsPath,
		JSON.stringify(
			{
				testDate: new Date().toISOString(),
				keywordsTested: TEST_KEYWORDS,
				generationTimeMs: endTime - startTime,
				validContentCount: validCount,
				sampleContent: database[TEST_KEYWORDS[0]],
				defaultConfig: {
					brandingText: defaultConfig.branding.brandingText,
					defaultTitle: defaultConfig.content.defaultTitle,
				},
				client1Config: {
					brandingText: client1Config.branding.brandingText,
					customFooterText: client1Config.branding.customFooterText,
					primaryColor: client1Config.styling.primaryColor,
				},
			},
			null,
			2
		)
	);

	console.log(`\nTest results saved to: ${resultsPath}`);
	console.log("\nTest completed successfully!");
}

// Run the test
runTest().catch((error) => {
	console.error("Test failed:", error);
	process.exit(1);
});
