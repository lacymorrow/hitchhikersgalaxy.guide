import type { BackgroundRemovalResponse } from "../types";
import { logger } from "@/lib/logger";
import Replicate from "replicate";
import { uploadToS3 } from "./image-processing";

const replicate = new Replicate({
	auth: process.env.REPLICATE_API_KEY || "",
});

export const GROUNDED_SAM_MODEL = "schananas/grounded_sam";
export const GROUNDED_SAM_VERSION =
	"ee871c19efb1941f55f66a3d7d960428c8a5afcb77449547fe8e5a3ab9ebc21c";

async function processStream(stream: ReadableStream, fileName: string): Promise<string> {
	const response = new Response(stream);
	const buffer = Buffer.from(await response.arrayBuffer());
	const result = await uploadToS3(buffer, fileName, "image/png");
	if (!result.success) {
		throw new Error("Failed to upload stream to S3");
	}
	return result.url;
}

export async function segmentHead(imageUrl: string): Promise<BackgroundRemovalResponse> {
	try {
		logger.info("Starting head segmentation with Grounded SAM", {
			imageUrl,
			model: GROUNDED_SAM_MODEL,
			version: GROUNDED_SAM_VERSION,
		});

		// Validate the URL
		if (!imageUrl.startsWith("http")) {
			logger.error("Invalid image URL provided", { imageUrl });
			return {
				success: false,
				url: "",
				error: "Invalid image URL. Please provide a direct HTTP(S) URL to the image.",
			};
		}

		// More specific prompt for head detection
		const modelParams = {
			image_path: imageUrl,
			mask_prompt: "close up portrait of face and head", // More specific prompt
			box_threshold: 0.5, // Increased confidence threshold
			text_threshold: 0.5, // Increased confidence threshold
			iou_threshold: 0.8,
		};

		// Call the Replicate API with the URL
		logger.info("Calling Grounded SAM with parameters", modelParams);

		const output = (await replicate.run(`${GROUNDED_SAM_MODEL}:${GROUNDED_SAM_VERSION}`, {
			input: modelParams,
		})) as unknown as ReadableStream[] | null;

		if (!output || !Array.isArray(output)) {
			logger.error("Invalid output from Grounded SAM", { output });
			return {
				success: false,
				url: "",
				error: "Failed to get valid output from head segmentation",
			};
		}

		// Log the number of outputs
		logger.info("Processing Grounded SAM outputs", {
			outputCount: output.length,
		});

		// Process each stream and get S3 URLs
		const timestamp = Date.now();
		const urls = await Promise.all(
			output.map((stream, index) => processStream(stream, `sam-output-${timestamp}-${index}.png`))
		);

		// Log all processed outputs
		logger.info("Processed Grounded SAM outputs", {
			outputCount: urls.length,
			outputs: {
				originalWithBox: urls[0] || null, // Original image with bounding box
				segmentationMask: urls[1] || null, // Binary segmentation mask
				finalOutput: urls[2] || null, // Final segmented image
				annotatedImage: urls[3] || null, // Image with annotations
			},
		});

		const finalOutput = urls[2]; // Use the final segmented image
		if (!finalOutput) {
			logger.error("Missing final output from Grounded SAM");
			return {
				success: false,
				url: "",
				error: "Failed to get final segmented image",
			};
		}

		logger.info("Successfully segmented head", {
			resultUrl: finalOutput,
			allOutputsAvailable: urls.length === 4,
			modelParams,
		});

		return {
			success: true,
			url: finalOutput,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
		logger.error("Head segmentation error", {
			error: errorMessage,
			modelInfo: {
				model: GROUNDED_SAM_MODEL,
				version: GROUNDED_SAM_VERSION,
			},
		});
		return {
			success: false,
			url: "",
			error: errorMessage,
		};
	}
}
