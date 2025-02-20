import { env } from "@/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

// Configure postgres with proper options to avoid stream transformation issues
const client = env.DATABASE_URL
	? postgres(env.DATABASE_URL, {
			prepare: false, // Disable prepared statements which can cause transform issues
			types: {
				// Ensure proper handling of date types
				date: {
					to: 1184,
					from: [1082, 1083, 1114, 1184],
					serialize: (date: Date) => date.toISOString(),
					parse: (isoString: string) => new Date(isoString),
				},
			},
	  })
	: undefined;

export const db = client ? drizzle(client, { schema }) : undefined;

// Export a function to check if the database is initialized and connected
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
