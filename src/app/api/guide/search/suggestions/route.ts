import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const term = searchParams.get("term");

	if (!term || term.length < 3) {
		return NextResponse.json({ suggestions: [] }, { status: 200 });
	}

	try {
		// Generate AI suggestions based on the search term
		const response = await openai.chat.completions.create({
			model: "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content: `You are a helpful assistant that suggests search completions.
          The user is typing a search term and you should suggest 2-3 possible completions.
          Focus on popular topics, memes, internet culture, and common search patterns.
          Return ONLY the suggestions as a JSON array of strings, nothing else.
          For example, if the user types "never gonna", you might suggest ["never gonna give you up", "never gonna let you down"].
          If the user types "plum", you might suggest ["plumbus", "plum pudding", "plum sauce"].
          Keep suggestions concise and relevant.`,
				},
				{
					role: "user",
					content: `Suggest completions for: "${term}"`,
				},
			],
			temperature: 0.7,
			max_tokens: 150,
			response_format: { type: "json_object" },
		});

		// Extract suggestions from the response
		const content = response.choices[0].message.content;
		let suggestions: string[] = [];

		try {
			// Make sure content is not empty or malformed before parsing
			if (!content || typeof content !== "string" || content.trim() === "") {
				console.log("[Suggestions API] Empty or invalid content received:", content);
				suggestions = [];
			} else {
				try {
					const parsedContent = JSON.parse(content);
					suggestions = Array.isArray(parsedContent.suggestions) ? parsedContent.suggestions : [];
				} catch (parseError) {
					console.error("[Suggestions API] Parse error:", parseError);
					console.log("[Suggestions API] Failed to parse content:", content);
					suggestions = [];
				}
			}
		} catch (error) {
			console.error("[Suggestions API] Error processing content:", error);
			suggestions = [];
		}

		// Return the suggestions
		return NextResponse.json({ suggestions }, { status: 200 });
	} catch (error) {
		console.error("[Suggestions API] Error:", error);
		return NextResponse.json(
			{ error: "Failed to generate suggestions", suggestions: [] },
			{ status: 500 }
		);
	}
}
