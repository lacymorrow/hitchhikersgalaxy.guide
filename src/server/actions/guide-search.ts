"use server";

import { openai } from "@/lib/open-ai";
import { guideService } from "@/server/services/guide-service";
import { rateLimitService, rateLimits } from "@/server/services/rate-limit-service";

const generateGuideEntry = async (searchTerm: string) => {
	if (!openai) {
		throw new Error("OpenAI API key is not set.");
	}

	const prompt = `You are the Hitchhiker's Guide to the Galaxy. Write an entry about "${searchTerm}" in the style of Douglas Adams.

Format your response as a JSON object with the following structure:
{
  "content": "Main description (witty, slightly absurd, with British humor)",
  "travelAdvice": "Travel advisory (if applicable)",
  "whereToFind": "Where to find it (can be completely made up)",
  "whatToAvoid": "Warnings and cautions",
  "funFact": "A fun fact (preferably something ridiculous but plausible-sounding)",
  "advertisement": "A subtle advertisement for a related product or service",
  "reliability": number between 0-100,
  "dangerLevel": number between 0-100
}

Keep the total length under 400 words. Make it entertaining and informative, with that distinctive Douglas Adams style of mixing profound observations with complete nonsense.`;

	const completion = await openai.chat.completions.create({
		model: "gpt-4-1106-preview",
		messages: [
			{
				role: "system",
				content:
					"You are the Hitchhiker's Guide to the Galaxy, known for its witty, irreverent, and slightly absurd explanations of everything in the universe. Your entries should be both informative and entertaining, with a perfect mix of useful information and complete nonsense. Remember to maintain that distinctively British humor throughout. Always respond with valid JSON.",
			},
			{
				role: "user",
				content: prompt,
			},
		],
		temperature: 0.9,
		max_tokens: 800,
		response_format: { type: "json_object" },
		functions: [
			{
				name: "create_guide_entry",
				parameters: {
					type: "object",
					properties: {
						content: { type: "string" },
						travelAdvice: { type: "string" },
						whereToFind: { type: "string" },
						whatToAvoid: { type: "string" },
						funFact: { type: "string" },
						advertisement: { type: "string" },
						reliability: { type: "integer", minimum: 0, maximum: 100 },
						dangerLevel: { type: "integer", minimum: 0, maximum: 100 },
					},
					required: [
						"content",
						"travelAdvice",
						"whereToFind",
						"whatToAvoid",
						"funFact",
						"advertisement",
						"reliability",
						"dangerLevel",
					],
				},
			},
		],
	});

	const response = completion.choices[0]?.message?.function_call?.arguments;
	if (!response) {
		throw new Error("Failed to generate guide entry");
	}

	return JSON.parse(response);
};

export const searchGuide = async (searchTerm: string, exactMatch = false) => {
	if (!searchTerm?.trim()) {
		return {
			success: false,
			error: "Search term is required",
		};
	}

	// Rate limiting
	try {
		await rateLimitService.checkLimit("guide-search", searchTerm, rateLimits.api.search);
	} catch (error) {
		console.error("[Guide Search] Rate limit error:", error);
		return {
			success: false,
			error: "Too many searches. Please try again in a minute.",
		};
	}

	// First, try to find an existing entry
	try {
		const existingEntry = await guideService.findExistingEntry(searchTerm, exactMatch);
		if (existingEntry) {
			return {
				success: true,
				data: existingEntry,
			};
		}
	} catch (error) {
		console.error("[Guide Search] Database search error:", error);
		// Don't return error here, try to create a new entry instead
		// This prevents 403 errors when database search fails but creation might work
	}

	// If no entry exists, generate one using AI
	try {
		if (!openai) {
			console.error("[Guide Search] OpenAI API key is not configured");
			return {
				success: false,
				error: "Our researchers are currently indisposed. Please try again later.",
			};
		}

		const entry = await generateGuideEntry(searchTerm);
		try {
			const newEntry = await guideService.createEntry({
				searchTerm,
				...entry,
			});

			return {
				success: true,
				data: newEntry,
			};
		} catch (dbError) {
			console.error("[Guide Search] Database creation error:", dbError);
			return {
				success: false,
				error: "Failed to save your search to the Guide. Please try again later.",
			};
		}
	} catch (error) {
		console.error("[Guide Search] AI generation error:", error);
		let errorMessage =
			"Our researchers are currently indisposed in the Restaurant at the End of the Universe. Please try again later.";

		if (error instanceof Error) {
			// If it's an OpenAI API error, provide a more specific message
			if (error.message.includes("OpenAI")) {
				errorMessage = "Our AI researchers are taking a tea break. Please try again in a moment.";
			}
		}

		return {
			success: false,
			error: errorMessage,
		};
	}
};
