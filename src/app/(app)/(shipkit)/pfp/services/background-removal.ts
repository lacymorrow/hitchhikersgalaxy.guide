import type { BackgroundRemovalResponse } from "../types";
import { logger } from "@/lib/logger";
import Replicate from "replicate";

const replicate = new Replicate({
	auth: process.env.REPLICATE_API_KEY || "",
});

// Updated to use a simpler model version
export const REPLICATE_MODEL = "cjwbw/rembg";
export const REPLICATE_VERSION = "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";

export async function removeBackground(imageData: string): Promise<BackgroundRemovalResponse> {
	try {
		logger.info("Starting background removal with Replicate");

		// Cast the output to the expected type using a two-step cast
		const output = (await replicate.run(`${REPLICATE_MODEL}:${REPLICATE_VERSION}`, {
			input: {
				image: imageData,
			},
		})) as unknown as string | null;

		if (!output) {
			logger.error("No output from Replicate");
			return {
				success: false,
				url: "",
				error: "Failed to get output from background removal",
			};
		}

		// The output is the URL of the processed image
		logger.info("Successfully removed background", { resultUrl: output });
		return {
			success: true,
			url: output,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
		logger.error("Background removal error", { error: errorMessage });
		return {
			success: false,
			url: "",
			error: errorMessage,
		};
	}
}
