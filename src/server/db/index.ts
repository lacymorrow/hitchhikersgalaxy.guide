import { env } from "@/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });

// Export a function to check if the database is initialized
export const isDatabaseInitialized = () => {
	return !!db;
};
