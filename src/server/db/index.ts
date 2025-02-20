import { env } from "@/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

// Configure postgres with proper options to avoid stream transformation issues
const client = env.DATABASE_URL
	? postgres(env.DATABASE_URL, {
			max: 1, // Use a single connection to avoid transform issues
			idle_timeout: 20, // Lower idle timeout
			max_lifetime: 60 * 30, // 30 minutes max lifetime
			transform: {
				undefined: null, // Transform undefined values to null
				...({} as Record<string, never>), // Empty transform object
			},
		})
	: undefined;

export const db = client ? drizzle(client, { schema }) : undefined;

// Export a function to check if the database is initialized and connected
export const isDatabaseInitialized = async () => {
	if (!db) return false;
	try {
		// First check basic connectivity
		await db.execute(sql`SELECT 1`);

		// Check if pg_trgm extension exists
		const hasExtension = await db.execute(sql`
			SELECT EXISTS (
				SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
			);
		`);

		// If extension doesn't exist, try to create it
		if (!hasExtension[0]?.exists) {
			try {
				await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
				console.log("Successfully created pg_trgm extension");
			} catch (extensionError) {
				console.warn(
					"Could not create pg_trgm extension. Similarity search will be disabled:",
					extensionError
				);
			}
		}

		return true;
	} catch (error) {
		console.error("Database connection failed:", error);
		return false;
	}
};
