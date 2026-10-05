import { describe, expect, it } from "vitest";
import { isBlockedSearchTerm } from "@/lib/guide-blocklist";

describe("isBlockedSearchTerm", () => {
	// Regression for LAC-4156: these DB entries existed from pre-blocklist
	// crawls and were still being emitted into the sitemap and /browse, where
	// their slug pages render notFound() with robots:noindex. Ahrefs flagged
	// 311 "noindex page in sitemap" URLs.
	it("blocks vulnerability-probe terms that were leaking into the sitemap", () => {
		for (const term of [
			"mainjs",
			"dumpsql",
			"databasesql",
			"alfa_data",
			"alfacgiapi",
			"archivezip",
			"hitchhikersgalaxyzip",
			"page-0986caa41f98c539js",
			"layout-73584a861a2f7533js",
			"nextjs",
			"travis touchdown",
		]) {
			expect(isBlockedSearchTerm(term), term).toBe(true);
		}
	});

	it("allows legitimate guide entries", () => {
		for (const term of [
			"babel fish",
			"zaphod beeblebrox",
			"42",
			"grok",
			"keyboard",
			"magrathea",
			"dont panic",
			"french fries",
		]) {
			expect(isBlockedSearchTerm(term), term).toBe(false);
		}
	});
});
