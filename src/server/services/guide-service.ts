import { db, isDatabaseInitialized } from "@/server/db";
import { guideEntries } from "@/server/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { cache } from "react";
import { isSSR } from "@/lib/utils/runtime";

if (!isDatabaseInitialized()) {
	throw new Error("Database connection not initialized");
}

// Since we've checked db is initialized, we can safely assert it's not undefined
const database = db!;

export const guideService = {
	getSimilarSearches: cache(async (searchTerm: string, limit = 5) => {
		if (!searchTerm?.trim()) return [];

		const normalizedTerm = searchTerm.toLowerCase().trim();

		// Use simpler search during SSR to avoid similarity function
		if (isSSR()) {
			return database.query.guideEntries.findMany({
				where: or(
					eq(guideEntries.searchTerm, normalizedTerm),
					ilike(guideEntries.searchTerm, `%${normalizedTerm}%`),
				),
				orderBy: [desc(guideEntries.popularity)],
				limit,
				with: {
					category: true,
				},
			});
		}

		// Use full similarity search at runtime
		return database.query.guideEntries.findMany({
			where: and(
				or(
					ilike(guideEntries.searchTerm, `%${normalizedTerm}%`),
					ilike(guideEntries.searchVector, `%${normalizedTerm}%`),
				),
				sql`similarity(${guideEntries.searchTerm}, ${normalizedTerm}) > 0.1`,
			),
			orderBy: [desc(guideEntries.popularity)],
			limit,
			with: {
				category: true,
			},
		});
	}),

	getRecentEntries: cache(async (limit = 10) => {
		return database.query.guideEntries.findMany({
			orderBy: [desc(guideEntries.createdAt)],
			limit,
			with: {
				category: true,
			},
		});
	}),

	getPopularEntries: cache(async (limit = 10) => {
		return database.query.guideEntries.findMany({
			orderBy: [desc(guideEntries.popularity)],
			limit,
			with: {
				category: true,
			},
		});
	}),

	findExistingEntry: async (searchTerm: string) => {
		const normalizedTerm = searchTerm.toLowerCase().trim();

		// Use simpler search during SSR to avoid similarity function
		if (isSSR()) {
			return database.query.guideEntries.findFirst({
				where: or(
					eq(guideEntries.searchTerm, normalizedTerm),
					ilike(guideEntries.searchTerm, `%${normalizedTerm}%`),
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

		const existingEntry = await database.query.guideEntries.findFirst({
			where: or(
				eq(guideEntries.searchTerm, normalizedTerm),
				ilike(guideEntries.searchTerm, `%${normalizedTerm}%`),
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

		if (existingEntry) {
			// Increment popularity only at runtime
			await database
				.update(guideEntries)
				.set({
					popularity: sql`${guideEntries.popularity} + 1`,
					updatedAt: new Date(),
				})
				.where(eq(guideEntries.id, existingEntry.id));
		}

		return existingEntry;
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
		const normalizedTerm = entry.searchTerm.toLowerCase().trim();

		// Generate search vector
		const searchVector = [
			normalizedTerm,
			...normalizedTerm.split(" "),
			...entry.content.toLowerCase().split(/\W+/),
			...entry.whereToFind.toLowerCase().split(/\W+/),
			...entry.whatToAvoid.toLowerCase().split(/\W+/),
		]
			.filter(Boolean)
			.join(" ");

		const [newEntry] = await database
			.insert(guideEntries)
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
				contributorId: "ai-researcher",
				searchVector,
				popularity: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		return newEntry;
	},
};
