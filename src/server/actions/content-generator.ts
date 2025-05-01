"use server";

import { openai } from "@/lib/open-ai";
import { generateAndCacheContent, getCachedContent } from "@/server/services/content-generation";
import { rateLimitService, rateLimits } from "@/server/services/rate-limit-service";
import { getConfig } from "@/config/seo-platform";

interface GeneratedContent {
	title: string;
	body: string;
	generatedAt: Date;
}

const generateContent = async (slug: string, clientId?: string): Promise<GeneratedContent> => {
	if (!openai) {
		throw new Error("OpenAI API key is not set.");
	}

	// Get white-label configuration
	const config = getConfig(clientId);

	// Determine which model to use based on client configuration
	const modelTier = config.content.generationModel;
	const openAIModel =
		modelTier === "premium"
			? "gpt-4-1106-preview"
			: modelTier === "standard"
				? "gpt-3.5-turbo-1106"
				: "gpt-3.5-turbo";

	// Format the slug into a more readable keyword
	const keyword = slug.split("/").join(" ").replace(/-/g, " ");

	const prompt = `Write informative content about "${keyword}".

Format your response as a JSON object with the following structure:
{
  "title": "An SEO-optimized title (under 60 characters)",
  "body": "The main content in HTML format. Include h2 headings, paragraphs, lists where appropriate. Optimize for SEO. Include relevant information about ${keyword}."
}

Keep the content professional, informative, and engaging. Optimize for search engines but make it valuable for human readers. Include relevant facts, data points, and information. Avoid unnecessary fluff.
The content should be well-structured with headings, paragraphs, and lists. Total content should be around 800-1200 words.`;

	// System message changes based on client's tier
	const systemMessage =
		modelTier === "premium"
			? "You are an expert SEO content writer. Create highly detailed, authoritative content optimized for search engines while providing exceptional value to readers. Include relevant facts, structured data, and comprehensive information. Always respond with valid JSON."
			: "You are an SEO content writer. Create informative content optimized for search engines while being valuable to readers. Always respond with valid JSON.";

	const completion = await openai.chat.completions.create({
		model: openAIModel,
		messages: [
			{
				role: "system",
				content: systemMessage,
			},
			{
				role: "user",
				content: prompt,
			},
		],
		temperature: 0.7,
		max_tokens: 2500,
		response_format: { type: "json_object" },
	});

	const response = completion.choices[0]?.message?.content;
	if (!response) {
		throw new Error("Failed to generate content");
	}

	try {
		const parsedResponse = JSON.parse(response);
		return {
			title: parsedResponse.title,
			body: parsedResponse.body,
			generatedAt: new Date(),
		};
	} catch (error) {
		console.error("Failed to parse AI response:", error);
		throw new Error("Failed to parse generated content");
	}
};

export const getOrGenerateContent = async (slug: string, clientId?: string) => {
	if (!slug?.trim()) {
		return {
			success: false,
			error: "Content slug is required",
		};
	}

	// Rate limiting
	try {
		await rateLimitService.checkLimit("content-generation", slug, rateLimits.api.search);
	} catch (error) {
		console.error("[Content Generation] Rate limit error:", error);
		return {
			success: false,
			error: "Too many requests. Please try again in a minute.",
		};
	}

	// First, try to find existing content
	try {
		const existingContent = await getCachedContent(slug);
		if (existingContent) {
			return {
				success: true,
				data: existingContent,
			};
		}
	} catch (error) {
		console.error("[Content Generation] Cache search error:", error);
		// Continue to generation if cache search fails
	}

	// If no content exists, generate new content
	try {
		if (!openai) {
			console.error("[Content Generation] OpenAI API key is not configured");
			return {
				success: false,
				error: "Content generation service is currently unavailable. Please try again later.",
			};
		}

		const content = await generateContent(slug, clientId);
		try {
			const newContent = await generateAndCacheContent(slug, content);

			return {
				success: true,
				data: newContent,
			};
		} catch (dbError) {
			console.error("[Content Generation] Storage error:", dbError);
			return {
				success: false,
				error: "Failed to save generated content. Please try again later.",
			};
		}
	} catch (error) {
		console.error("[Content Generation] AI generation error:", error);
		let errorMessage =
			"Content generation service is currently unavailable. Please try again later.";

		if (error instanceof Error) {
			if (error.message.includes("OpenAI")) {
				errorMessage = "Our AI service is temporarily unavailable. Please try again in a moment.";
			}
		}

		return {
			success: false,
			error: errorMessage,
		};
	}
};
