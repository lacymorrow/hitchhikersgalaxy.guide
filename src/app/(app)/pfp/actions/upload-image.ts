"use server";

import { revalidatePath } from "next/cache";
import type { UploadResponse } from "../types";
import { processImage } from "./process-image";

export async function uploadImage(formData: FormData): Promise<UploadResponse> {
	try {
		const file = formData.get("file") as File;
		if (!file) {
			throw new Error("No file provided");
		}

		// Validate file type
		if (!file.type.startsWith("image/")) {
			throw new Error("Invalid file type. Please upload an image.");
		}

		// Validate file size (5MB limit)
		if (file.size > 5 * 1024 * 1024) {
			throw new Error("File size too large. Please upload an image under 5MB.");
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const processResult = await processImage(buffer, file.name, file.type);

		if (!processResult.success) {
			throw new Error(processResult.error || "Failed to process image");
		}

		revalidatePath("/pfp");

		return {
			success: true,
			url: processResult.url,
		};
	} catch (error) {
		console.error("Upload error:", error);
		return {
			success: false,
			url: "",
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}
