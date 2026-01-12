import { env } from "@/env";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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
