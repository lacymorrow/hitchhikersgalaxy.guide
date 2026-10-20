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
			
		]) {
			expect(isBlockedSearchTerm(term), term).toBe(true);
		}
	});

	// Regression for the PR #19 review: extracting this module out of
	// guide-search.ts carried only the first 15 exact terms and left the whole
	// ex-Shipkit template block behind. #18 deleted those pages, so each of these
	// paths fell through to [slug] and spent an OpenAI call plus a guide_entries
	// row on every crawler hit of a stale URL. The sitemap filter then hid the
	// result, so nothing would have surfaced it but the bill.
	it("blocks top-level paths left over from the Shipkit template", () => {
		for (const term of [
			"dashboard",
			"pricing",
			"features",
			"faq",
			"docs",
			"blog",
			"changelog",
			"waitlist",
			"settings",
			"install",
			"checkout",
			"connect",
			"dev",
			"cms",
			"cms-api",
			"bones",
			"download",
			"downloads",
			"deployments",
			"projects",
			"teams",
			"tools",
			"api-keys",
			"examples",
			"landing-01",
			"pricing-01",
			"blog-authors",
			"browser",
			"network",
			"trpc",
			"upload",
			"launch",
			"builder-io",
			"google-docs",
			"polar",
			"pages",
			"rssxml",
			"llmstxt",
			"llms-fulltxt",
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
			"travis touchdown",
			"elephant",
		]) {
			expect(isBlockedSearchTerm(term), term).toBe(false);
		}
	});
});
