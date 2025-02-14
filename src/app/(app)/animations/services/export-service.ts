import { type AnimationMetadata } from "../types";

interface ExportOptions {
	format: "mp4" | "gif" | "webm";
	quality: "draft" | "preview" | "production";
	fps?: number;
	width?: number;
	height?: number;
	startFrame?: number;
	endFrame?: number;
	codec?: string;
	bitrate?: number;
}

const DEFAULT_OPTIONS: ExportOptions = {
	format: "mp4",
	quality: "production",
};

export const exportAnimation = async (
	animation: AnimationMetadata,
	options: Partial<ExportOptions> = {},
) => {
	const exportOptions = { ...DEFAULT_OPTIONS, ...options };
	const { format, quality, fps, width, height, startFrame, endFrame } =
		exportOptions;

	// Build export configuration
	const config = {
		fps: fps ?? animation.fps,
		width: width ?? animation.width,
		height: height ?? animation.height,
		startFrame: startFrame ?? 0,
		endFrame: endFrame ?? animation.duration * animation.fps,
		quality: quality === "draft" ? 0.5 : quality === "preview" ? 0.8 : 1,
		format,
		codec: exportOptions.codec,
		bitrate: exportOptions.bitrate,
	};

	try {
		// Call the Remotion export API
		const response = await fetch("/api/animations/export", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				animationId: animation.id,
				config,
			}),
		});

		if (!response.ok) {
			throw new Error("Export failed");
		}

		const result = await response.json();
		return result.url;
	} catch (error) {
		console.error("Animation export failed:", error);
		throw error;
	}
};
