"use server";

import { z } from "zod";
import { openai } from "@/lib/open-ai";
import { ErrorService } from "@/server/services/error-service";
import { ValidationService } from "@/server/services/validation-service";

const schemas = {
	chat: z.object({
		messages: z.array(
			z.object({
				role: z.enum(["user", "assistant", "system"]),
				content: z.string(),
			})
		),
	}),
} as const;

export async function chat(data: z.infer<typeof schemas.chat>) {
	try {
		// Validate input
		await ValidationService.validateOrThrow(schemas.chat, data);

		if (!openai) {
			throw new Error("OpenAI API key is not set.");
		}

		const completion = await openai.chat.completions.create({
			model: "gpt-4-turbo-preview",
			messages: data.messages,
			temperature: 0.7,
			stream: true,
		});

		const encoder = new TextEncoder();
		const responseStream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of completion) {
						const content = chunk.choices[0]?.delta?.content || "";
						controller.enqueue(encoder.encode(content));
					}
					controller.close();
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Stream error";
					controller.enqueue(encoder.encode(`Error: ${errorMessage}`));
					controller.close();
				}
			},
		});

		return new Response(responseStream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
			},
		});
	} catch (error) {
		console.error("Chat action error:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "An error occurred",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
}
