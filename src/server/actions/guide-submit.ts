"use server";

import { guideService } from "@/server/services/guide-service";
import { z } from "zod";

const formSchema = z.object({
	searchTerm: z
		.string()
		.min(2, "Search term must be at least 2 characters")
		.max(100, "Search term must be less than 100 characters"),
	content: z
		.string()
		.min(5, "Content must be at least 5 characters")
		.max(2000, "Content must be less than 2000 characters"),
	travelAdvice: z
		.string()
		.min(5, "Travel advice must be at least 5 characters")
		.max(500, "Travel advice must be less than 500 characters"),
	whereToFind: z
		.string()
		.min(5, "Location must be at least 5 characters")
		.max(500, "Location must be less than 500 characters"),
	whatToAvoid: z
		.string()
		.min(5, "Warnings must be at least 5 characters")
		.max(500, "Warnings must be less than 500 characters"),
	funFact: z
		.string()
		.min(5, "Fun fact must be at least 5 characters")
		.max(500, "Fun fact must be less than 500 characters"),
	advertisement: z
		.string()
		.max(500, "Advertisement must be less than 500 characters")
		.optional()
		.transform((val) => val || ""), // Transform undefined to empty string
});

export async function submitGuideEntry(values: z.infer<typeof formSchema>) {
	try {
		// Validate the input
		const validatedData = formSchema.parse(values);

		// Add reliability and danger level
		const entry = await guideService.createEntry({
			...validatedData,
			reliability: Math.floor(Math.random() * 40) + 60, // 60-100%
			dangerLevel: Math.floor(Math.random() * 100), // 0-100%
		});

		return { success: true, data: entry };
	} catch (error) {
		console.error("[Guide Submit Action] Error:", error);
		return { success: false, error: "Failed to submit entry" };
	}
}
