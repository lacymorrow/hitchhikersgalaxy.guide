import "server-only";

import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

// Configure postgres with proper options to avoid stream transformation issues
const client = env.DATABASE_URL
	? postgres(env.DATABASE_URL, {
			max: 1, // Use a single connection to avoid transform issues
			connect_timeout: 10, // Faster connection timeout for serverless
			idle_timeout: 20, // Lower idle timeout
			max_lifetime: 60 * 30, // 30 minutes max lifetime
			...(process.env.NODE_ENV === "development"
				? {
						ssl: { rejectUnauthorized: false }, // Needed for some Neon connections
					}
				: {}),
			transform: {
				undefined: null, // Transform undefined values to null
				...({} as Record<string, never>), // Empty transform object
			},
		})
	: undefined;

export const db = client ? drizzle(client, { schema }) : undefined;

// Export a function to check if the database is initialized and connected - Prefer checking db instead
export const isDatabaseInitialized = async () => {
	if (!db) return false;
	try {
		await db.execute(sql`SELECT 1`);
		return true;
	} catch (error) {
		console.error("Database connection failed:", error);
		return false;
	}
};

/**
 * Safe database execution utility
 * Executes a database operation only if the database is initialized
 * Returns a default value if the database is not available
 *
 * @param callback - The database operation to execute
 * @param defaultValue - The value to return if database is not initialized
 * @returns Promise<T> - The result of the callback or the default value
 */
export const safeDbExecute = async <T>(
	callback: (db: PostgresJsDatabase<typeof schema>) => Promise<T>,
	defaultValue: T
): Promise<T> => {
	if (!db) {
		console.warn("Database not initialized, returning default value");
		return defaultValue;
	}

	try {
		return await callback(db);
	} catch (error) {
		console.error("Database operation failed:", error);
		return defaultValue;
	}
};

// Export schema for direct usage
export * from "./schema";

export { schema };
