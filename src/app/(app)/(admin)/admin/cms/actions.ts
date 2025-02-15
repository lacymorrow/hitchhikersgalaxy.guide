"use server";

import { env } from "@/env";
import { seed } from "@/lib/payload/seed";

/**
 * Server action to seed the CMS with initial data
 * Only works in production with a valid admin secret
 */
export async function seedCMSAction(adminSecret: string) {
	try {
		// Verify admin secret
		if (!adminSecret || adminSecret !== env.PAYLOAD_SECRET) {
			throw new Error("Invalid admin secret");
		}

		// Run the seed
		await seed();

		return { success: true, message: "CMS seeded successfully" };
	} catch (error) {
		console.error("Error seeding CMS:", error);
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}
