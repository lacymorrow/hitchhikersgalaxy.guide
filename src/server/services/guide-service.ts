import { isSSR } from "@/lib/utils/runtime";
import { db } from "@/server/db";
import { guideEntries } from "@/server/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import pluralize from "pluralize";
import { cache } from "react";

// Since we're in a service, we can assume the database is initialized
// The connection is handled at the app level

// Track if similarity search is available
let hasSimilaritySearch: boolean | null = null;

async function checkSimilaritySearch() {
	if (hasSimilaritySearch !== null) return hasSimilaritySearch;
	if (!db) return false;

	try {
		// Try a simple similarity query
		await db?.execute(sql`SELECT similarity('test', 'test')`);
		hasSimilaritySearch = true;
	} catch (error) {
		console.warn("Similarity search not available, falling back to basic search");
		hasSimilaritySearch = false;
	}
	return hasSimilaritySearch;
}

function normalizeSearchTerm(searchTerm: string | null | undefined): string {
	// Return empty string for null/undefined/empty values
	if (!searchTerm?.trim()) {
		return "";
	}

	// Convert to lowercase and trim
	let normalized = searchTerm.toLowerCase().trim();

	// Remove special characters and extra spaces
	normalized = normalized.replace(/[^\w\s-]/g, "").replace(/\s+/g, " ");

	// Get the singular form of the word
	normalized = pluralize.singular(normalized);

	// Convert spaces to hyphens for URL-friendly slugs
	normalized = normalized.replace(/\s/g, "-");

	return normalized;
}

export const guideService = {
	getSimilarSearches: cache(async (searchTerm: string, limit = 5) => {
		if (!searchTerm?.trim()) return [];

		try {
			const normalizedTerm = normalizeSearchTerm(searchTerm);
			if (!normalizedTerm) return [];

			// Create an alternative version of the term (with spaces instead of hyphens)
			const alternativeTerm = normalizedTerm.replace(/-/g, " ");

			// Always use basic search during SSR or if similarity search isn't available
			if (isSSR() || !(await checkSimilaritySearch())) {
				return db?.query.guideEntries.findMany({
					where: or(
						eq(guideEntries.searchTerm, normalizedTerm),
						eq(guideEntries.searchTerm, alternativeTerm),
						ilike(guideEntries.searchTerm, `%${normalizedTerm}%`),
						ilike(guideEntries.searchTerm, `%${alternativeTerm}%`),
						ilike(guideEntries.searchVector, `%${normalizedTerm}%`),
						ilike(guideEntries.searchVector, `%${alternativeTerm}%`)
					),
					orderBy: [desc(guideEntries.popularity)],
					limit,
					with: {
						category: true,
					},
				});
			}

			// Use full similarity search at runtime
			return db?.query.guideEntries.findMany({
				where: and(
					or(
						ilike(guideEntries.searchTerm, `%${normalizedTerm}%`),
						ilike(guideEntries.searchTerm, `%${alternativeTerm}%`),
						ilike(guideEntries.searchVector, `%${normalizedTerm}%`),
						ilike(guideEntries.searchVector, `%${alternativeTerm}%`)
					),
					or(
						sql`similarity(${guideEntries.searchTerm}, ${normalizedTerm}) > 0.3`,
						sql`similarity(${guideEntries.searchTerm}, ${alternativeTerm}) > 0.3`
					)
				),
				orderBy: [
					// Order by similarity score first, then by popularity
					sql`GREATEST(
						similarity(${guideEntries.searchTerm}, ${normalizedTerm}),
						similarity(${guideEntries.searchTerm}, ${alternativeTerm})
					) DESC`,
					desc(guideEntries.popularity),
				],
				limit,
				with: {
					category: true,
				},
			});
		} catch (error) {
			console.error("[Guide Service] Error in getSimilarSearches:", error);
			return [];
		}
	}),

	getRecentEntries: cache(async (limit = 10) => {
		try {
			return db?.query.guideEntries.findMany({
				orderBy: [desc(guideEntries.createdAt)],
				limit,
				with: {
					category: true,
				},
			});
		} catch (error) {
			console.error("[Guide Service] Error in getRecentEntries:", error);
			return [];
		}
	}),

	getPopularEntries: cache(async (limit = 10) => {
		try {
			return db?.query.guideEntries.findMany({
				orderBy: [desc(guideEntries.popularity)],
				limit,
				with: {
					category: true,
				},
			});
		} catch (error) {
			console.error("[Guide Service] Error in getPopularEntries:", error);
			return [];
		}
	}),

	findExistingEntry: async (searchTerm: string | null | undefined) => {
		try {
			if (!searchTerm?.trim()) {
				return null;
			}

			const normalizedTerm = normalizeSearchTerm(searchTerm);
			if (!normalizedTerm) {
				return null;
			}

			// Create an alternative version of the term (with spaces instead of hyphens)
			const alternativeTerm = normalizedTerm.replace(/-/g, " ");

			// Always use basic search during SSR or if similarity search isn't available
			if (isSSR() || !(await checkSimilaritySearch())) {
				return db?.query.guideEntries.findFirst({
					where: or(
						eq(guideEntries.searchTerm, normalizedTerm),
						eq(guideEntries.searchTerm, alternativeTerm),
						ilike(guideEntries.searchTerm, `%${normalizedTerm}%`),
						ilike(guideEntries.searchTerm, `%${alternativeTerm}%`)
					),
					with: {
						category: true,
						sourceCrossReferences: {
							with: {
								targetEntry: true,
							},
						},
					},
				});
			}

			// Find the most similar existing entry
			const existingEntry = await db?.query.guideEntries.findFirst({
				where: or(
					sql`similarity(${guideEntries.searchTerm}, ${normalizedTerm}) > 0.3`,
					sql`similarity(${guideEntries.searchTerm}, ${alternativeTerm}) > 0.3`
				),
				orderBy: [
					// Order by similarity score
					sql`GREATEST(
						similarity(${guideEntries.searchTerm}, ${normalizedTerm}),
						similarity(${guideEntries.searchTerm}, ${alternativeTerm})
					) DESC`,
					desc(guideEntries.popularity),
				],
				with: {
					category: true,
					sourceCrossReferences: {
						with: {
							targetEntry: true,
						},
					},
				},
			});

			if (existingEntry) {
				try {
					// Increment popularity only at runtime
					await db
						?.update(guideEntries)
						.set({
							popularity: sql`${guideEntries.popularity} + 1`,
							updatedAt: new Date(),
						})
						.where(eq(guideEntries.id, existingEntry.id));
				} catch (updateError) {
					console.error("[Guide Service] Error updating entry popularity:", updateError);
					// Don't throw the error since this is not critical
				}
			}

			return existingEntry;
		} catch (error) {
			console.error("[Guide Service] Error in findExistingEntry:", error);
			return null;
		}
	},

	createEntry: async (entry: {
		searchTerm: string;
		content: string;
		travelAdvice: string;
		whereToFind: string;
		whatToAvoid: string;
		funFact: string;
		advertisement: string;
		reliability: number;
		dangerLevel: number;
	}) => {
		try {
			if (!entry.searchTerm?.trim()) {
				throw new Error("Search term is required");
			}

			const normalizedTerm = normalizeSearchTerm(entry.searchTerm);
			if (!normalizedTerm) {
				throw new Error("Invalid search term");
			}

			// Generate search vector with more comprehensive terms
			const searchVector = [
				normalizedTerm,
				pluralize.plural(normalizedTerm), // Add plural form
				...normalizedTerm.split(" "),
				...entry.content.toLowerCase().split(/\W+/),
				...entry.whereToFind.toLowerCase().split(/\W+/),
				...entry.whatToAvoid.toLowerCase().split(/\W+/),
			]
				.filter(Boolean)
				.join(" ");

			const result = await db
				?.insert(guideEntries)
				.values({
					searchTerm: normalizedTerm,
					content: entry.content,
					travelAdvice: entry.travelAdvice,
					whereToFind: entry.whereToFind,
					whatToAvoid: entry.whatToAvoid,
					funFact: entry.funFact,
					advertisement: entry.advertisement,
					reliability: entry.reliability,
					dangerLevel: entry.dangerLevel,
					searchVector,
					popularity: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			if (!result) {
				throw new Error("Failed to create entry");
			}

			const newEntry = result[0];

			return newEntry;
		} catch (error) {
			console.error("[Guide Service] Error in createEntry:", error);
			throw error;
		}
	},
};
