import { db } from "@/server/db";
import { guideEntries } from "@/server/db/schema";
import { sql } from "drizzle-orm";

export async function getSimilarSearches(searchTerm: string) {
	if (!db) {
		throw new Error("Database not initialized");
	}

	return db
		.select()
		.from(guideEntries)
		.where(sql`LOWER(${guideEntries.searchTerm}) LIKE LOWER(${`%${searchTerm}%`})`)
		.limit(5);
}
