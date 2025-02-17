"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ImageFile } from "../types";
import { uploadImage } from "../actions/upload-image";
import { processImage, applyBackgroundColor } from "../actions/process-image";
import { ColorPicker } from "./color-picker";
import { ImagePreview } from "./image-preview";
import { FileUpload } from "./file-upload";

export const UploadForm = () => {
	const router = useRouter();
	const [backgroundColor, setBackgroundColor] = useState("#4ECDC4");
	const [processedImage, setProcessedImage] = useState<string | undefined>(undefined);
	const [isUploading, setIsUploading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [originalImage, setOriginalImage] = useState<string | undefined>(undefined);

	const handleFileSelect = async (file: File) => {
		try {
			setIsUploading(true);
			const formData = new FormData();
			formData.append("file", file);

			const uploadResult = await uploadImage(formData);
			if (!uploadResult.success) {
				throw new Error(uploadResult.error || "Failed to upload image");
			}

			setOriginalImage(uploadResult.url);
			setProcessedImage(uploadResult.url);
			toast.success("Image processed successfully!");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "An error occurred");
		} finally {
			setIsUploading(false);
			router.refresh();
		}
	};

	const handleBackgroundColorChange = async (color: string) => {
		// Update the preview color immediately
		setBackgroundColor(color);

		if (!originalImage) return;

		try {
			setIsProcessing(true);

			const result = await applyBackgroundColor(originalImage, color);
			if (!result.success) {
				throw new Error(result.error || "Failed to apply background color");
			}

			setProcessedImage(result.url);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "An error occurred");
			// Don't revert the color on error - keep the preview showing the selected color
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="space-y-8">
			<div className="flex flex-col items-center justify-center space-y-4">
				<ImagePreview
					src={processedImage}
					backgroundColor={backgroundColor}
					isProcessing={isProcessing}
					className="mb-8"
				/>
				<div className="w-full max-w-sm space-y-4">
					<FileUpload onFileSelect={handleFileSelect} isUploading={isUploading} />
					<ColorPicker value={backgroundColor} onChange={handleBackgroundColorChange} />
				</div>
			</div>
		</div>
	);
};
