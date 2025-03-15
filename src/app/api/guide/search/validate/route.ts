import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const term = searchParams.get("term");

	if (!term || term.trim().length === 0) {
		return NextResponse.json(
			{
				valid: false,
				reason: "Empty search term",
			},
			{ status: 400 }
		);
	}

	try {
		// Use AI to validate if the term is a valid word, pop culture reference, meme, etc.
		const response = await openai.chat.completions.create({
			model: "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content: `You are a validator that determines if a search term is valid.
          A valid term can be:
          1. A real English word
          2. A pop culture reference
          3. A meme or internet slang
          4. A proper noun (name, place, brand, etc.)
          5. A technical term
          6. Something that sounds like it could be a real term

          Invalid terms are:
          1. Random keyboard mashing
          2. Excessive special characters
          3. Nonsensical character combinations
          4. Strings that don't resemble any known word pattern

          Respond with a JSON object containing:
          - "valid": boolean - whether the term is valid
          - "reason": string - brief explanation of why it's valid or invalid
          - "category": string - (only if valid) what category the term falls into (word, meme, etc.)

          Examples:
          - "plumbus" -> valid (pop culture reference from Rick and Morty)
          - "asdfghjkl" -> invalid (random keyboard mashing)
          - "skibidi toilet" -> valid (internet meme)
          - "hunter2" -> valid (internet meme about password censoring)
          - "!@#$%^&" -> invalid (just special characters)
          - "qwxzjqwxzj" -> invalid (random uncommon letters)
          - "covfefe" -> valid (internet meme/pop culture reference)
          - "doggo" -> valid (internet slang for dog)
          - "yeet" -> valid (internet slang)
          - "42" -> valid (pop culture reference to Hitchhiker's Guide)
          `,
				},
				{
					role: "user",
					content: `Validate this search term: "${term}"`,
				},
			],
			temperature: 0.3,
			max_tokens: 150,
			response_format: { type: "json_object" },
		});

		// Extract validation result from the response
		const content = response.choices[0].message.content;
		let validationResult = { valid: false, reason: "Failed to validate term" };

		try {
			validationResult = JSON.parse(content || "{}");
		} catch (parseError) {
			console.error("[Validation API] Parse error:", parseError);
		}

		// Return the validation result
		return NextResponse.json(validationResult, { status: 200 });
	} catch (error) {
		console.error("[Validation API] Error:", error);
		return NextResponse.json({ valid: false, reason: "Failed to validate term" }, { status: 500 });
	}
}
