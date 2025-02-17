"use server";

import { revalidatePath } from "next/cache";
import type { ProcessImageResponse } from "../types";
import { removeBackground } from "../services/background-removal";
import { uploadToS3 } from "../services/image-processing";
import { logger } from "@/lib/logger";

export async function processImage(
	imageBuffer: Buffer,
	fileName: string,
	contentType: string
): Promise<ProcessImageResponse> {
	try {
		logger.info("Starting image processing", { fileName, contentType });

		// Convert buffer to base64 for Replicate
		const base64Image = imageBuffer.toString("base64");
		const dataUrl = `data:${contentType};base64,${base64Image}`;

		// Remove background using base64 data directly
		const removedBg = await removeBackground(dataUrl);
		if (!removedBg.success) {
			logger.error("Background removal failed", { error: removedBg.error });
			throw new Error(removedBg.error || "Failed to remove background");
		}

		// Download the processed image
		logger.info("Downloading processed image", { url: removedBg.url });
		const response = await fetch(removedBg.url);
		if (!response.ok) {
			throw new Error("Failed to download processed image");
		}

		const processedImageBuffer = Buffer.from(await response.arrayBuffer());

		// Upload processed image to S3
		const processedFileName = `processed-${fileName}`;
		logger.info("Uploading processed image", { fileName: processedFileName });
		const uploadResult = await uploadToS3(processedImageBuffer, processedFileName, "image/png");

		if (!uploadResult.success) {
			logger.error("Upload failed", { error: uploadResult.error });
			throw new Error(uploadResult.error || "Failed to upload processed image");
		}

		logger.info("Image processing completed successfully", { url: uploadResult.url });
		revalidatePath("/pfp");

		return {
			success: true,
			url: uploadResult.url,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
		logger.error("Image processing error", { error: errorMessage });
		return {
			success: false,
			url: "",
			error: errorMessage,
		};
	}
}

export async function applyBackgroundColor(
	imageUrl: string,
	backgroundColor: string
): Promise<ProcessImageResponse> {
	try {
		logger.info("Applying background color", { imageUrl, backgroundColor });

		// Download the processed image
		const response = await fetch(imageUrl);
		if (!response.ok) {
			throw new Error("Failed to download processed image");
		}

		const imageBuffer = Buffer.from(await response.arrayBuffer());

		// TODO: Implement background color application
		// For now, we'll just return the original image
		return {
			success: true,
			url: imageUrl,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
		logger.error("Background color application error", { error: errorMessage });
		return {
			success: false,
			url: "",
			error: errorMessage,
		};
	}
}
