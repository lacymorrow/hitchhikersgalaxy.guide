"use server";

import { z } from "zod";
import { detectSpam } from "./spam-service";

const schema = z.object({
	text: z.string().min(1, "Text is required").max(5000, "Text is too long"),
});

export async function analyzeSpamAction(formData: FormData) {
	try {
		const text = formData.get("text");
		const validatedFields = schema.parse({ text });

		const result = await detectSpam(validatedFields.text);

		return {
			success: true,
			data: result,
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: "Invalid input. Please check your text.",
			};
		}

		return {
			success: false,
			error: "Failed to analyze text. Please try again.",
		};
	}
}
