import { getPayloadClient } from "@/lib/payload/payload";
import { db } from "@/server/db";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { seed } from "./seed";

async function syncDatabase() {
	console.log("🔄 Starting database synchronization...");

	try {
		// 1. Run Drizzle migrations
		console.log("📦 Running Drizzle migrations...");
		try {
			await migrate(db, {
				migrationsFolder: path.join(process.cwd(), "src/migrations"),
			});
			console.log("✅ Drizzle migrations completed");
		} catch (error) {
			// Check if the error is about existing types
			if (error instanceof Error && error.message.includes("already exists")) {
				console.warn("⚠️ Some database objects already exist, continuing...");
			} else {
				throw error;
			}
		}

		// 2. Initialize Payload
		console.log("🚀 Initializing Payload CMS...");
		const payload = await getPayloadClient();
		console.log("✅ Payload CMS initialized");

		// 3. Run database seeding if needed
		if (process.env.SEED_DB === "true") {
			console.log("🌱 Running database seed...");
			// Import and run your seed function

			await seed();
			console.log("✅ Database seeded");
		}

		console.log("✨ Database synchronization completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error synchronizing database:", error);
		process.exit(1);
	}
}

void syncDatabase();
