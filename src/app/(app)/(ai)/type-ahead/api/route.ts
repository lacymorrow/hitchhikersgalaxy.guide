/**
 * API Endpoint: /api/ai/text-completion
 * Description:
 * This endpoint receives a text input from the user and provides
 * suggestions for auto-completion using the OpenAI GPT-3.5 Turbo model.
 * It returns a stream of text completions.
 */

import { openai } from "@/lib/open-ai";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
	const { text } = await req.json();

	if (!text) {
		return NextResponse.json(
			{ error: "Text input is required." },
			{ status: 400 },
		);
	}

	if (!openai) {
		return NextResponse.json(
			{ error: "OpenAI API key is not set." },
			{ status: 500 },
		);
	}

	try {
		const response = await openai.chat.completions.create({
			model: "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content:
						"You are an AI assistant that helps complete the user's text input. Provide a natural continuation of the text without adding any questions or extra conversation.",
				},
				{
					role: "user",
					content: text,
				},
			],
			max_tokens: 10,
			temperature: 0.5,
			n: 1,
			stop: null, // Ensure that the assistant doesn't stop early
		});

		const suggestion = response.choices[0]?.message.content?.trim();
		return NextResponse.json({ suggestion });
	} catch (error) {
		console.error("Error fetching suggestion:", error);
		return NextResponse.json(
			{ error: "Error fetching suggestion" },
			{ status: 500 },
		);
	}
};
