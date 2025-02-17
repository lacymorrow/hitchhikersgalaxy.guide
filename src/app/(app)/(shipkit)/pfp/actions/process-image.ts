"use server";

import { revalidatePath } from "next/cache";
import type { ProcessImageResponse } from "../types";
import { removeBackground } from "../services/background-removal";
import { segmentHead } from "../services/head-segmentation";
import { uploadToS3 } from "../services/image-processing";
import { logger } from "@/lib/logger";

export async function processImage(
	imageBuffer: Buffer,
	fileName: string,
	contentType: string
): Promise<ProcessImageResponse> {
	try {
		logger.info("Starting image processing", { fileName, contentType });

		// Convert buffer to base64 for background removal
		const base64Image = imageBuffer.toString("base64");
		const dataUrl = `data:${contentType};base64,${base64Image}`;

		// Remove background using base64 data directly
		logger.info("Step 1: Removing background", {
			inputType: "base64",
			contentType,
			inputSize: dataUrl.length,
		});

		const removedBg = await removeBackground(dataUrl);
		if (!removedBg.success) {
			logger.error("Background removal failed", { error: removedBg.error });
			throw new Error(removedBg.error || "Failed to remove background");
		}

		logger.info("Background removal successful", {
			outputUrl: removedBg.url,
			step: "1/4",
		});

		// Download the background-removed image
		logger.info("Step 2: Downloading background-removed image", { url: removedBg.url });
		const bgRemovedResponse = await fetch(removedBg.url);
		if (!bgRemovedResponse.ok) {
			throw new Error("Failed to download background-removed image");
		}

		// Upload the background-removed image to S3 to get a direct URL
		const bgRemovedBuffer = Buffer.from(await bgRemovedResponse.arrayBuffer());
		const bgRemovedFileName = `bg-removed-${fileName}`;
		logger.info("Step 3: Uploading background-removed image to S3", {
			fileName: bgRemovedFileName,
			fileSize: bgRemovedBuffer.length,
			step: "2/4",
		});

		const bgRemovedUpload = await uploadToS3(bgRemovedBuffer, bgRemovedFileName, "image/png");
		if (!bgRemovedUpload.success) {
			logger.error("Failed to upload background-removed image", { error: bgRemovedUpload.error });
			throw new Error(bgRemovedUpload.error || "Failed to upload background-removed image");
		}

		logger.info("S3 upload successful", {
			outputUrl: bgRemovedUpload.url,
			step: "3/4",
		});

		// Ensure we have a valid HTTP URL for head segmentation
		const imageUrl = bgRemovedUpload.url.startsWith("http")
			? bgRemovedUpload.url
			: `https://${bgRemovedUpload.url}`;

		// Segment head using the S3 URL
		logger.info("Step 4: Starting head segmentation", {
			imageUrl,
			step: "4/4",
		});

		const segmentedHead = await segmentHead(imageUrl);
		if (!segmentedHead.success) {
			logger.error("Head segmentation failed", { error: segmentedHead.error });
			throw new Error(segmentedHead.error || "Failed to segment head");
		}

		logger.info("Head segmentation successful", {
			outputUrl: segmentedHead.url,
		});

		// Download the processed image
		logger.info("Final Step: Downloading processed image", { url: segmentedHead.url });
		const response = await fetch(segmentedHead.url);
		if (!response.ok) {
			throw new Error("Failed to download processed image");
		}

		const processedImageBuffer = Buffer.from(await response.arrayBuffer());

		// Upload final processed image to S3
		const processedFileName = `processed-${fileName}`;
		logger.info("Final Step: Uploading processed image", {
			fileName: processedFileName,
			fileSize: processedImageBuffer.length,
		});

		const uploadResult = await uploadToS3(processedImageBuffer, processedFileName, "image/png");
		if (!uploadResult.success) {
			logger.error("Upload failed", { error: uploadResult.error });
			throw new Error(uploadResult.error || "Failed to upload processed image");
		}

		logger.info("🎉 Image processing completed successfully", {
			finalUrl: uploadResult.url,
			processingSteps: {
				"1": "Background removal",
				"2": "Download background-removed image",
				"3": "Upload to S3",
				"4": "Head segmentation",
				"5": "Final processing and upload",
			},
		});
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
