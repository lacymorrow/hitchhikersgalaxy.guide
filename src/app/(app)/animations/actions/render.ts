"use server";

import { v4 as uuidv4 } from "uuid";
import { RenderError, RenderService } from "../services/render-service";
import type { RenderJob } from "../types";

export async function queueRender(
	animationId: string,
	settings: {
		format: "mp4" | "gif" | "webm";
		quality: "draft" | "preview" | "production";
		resolution: {
			width: number;
			height: number;
		};
	},
): Promise<RenderJob> {
	try {
		const renderService = RenderService.getInstance();

		const job: RenderJob = {
			id: uuidv4(),
			animationId,
			status: "queued",
			progress: 0,
			settings: {
				format: settings.format,
				quality: settings.quality,
				resolution: settings.resolution,
			},
		};

		return await renderService.queueRender(job);
	} catch (error) {
		if (error instanceof RenderError) {
			throw new Error(`Render failed: ${error.message} (${error.code})`);
		}
		throw new Error("Failed to queue render job");
	}
}

export async function getRenderStatus(
	jobId: string,
): Promise<RenderJob | null> {
	try {
		const renderService = RenderService.getInstance();
		const status = renderService.getRenderStatus(jobId);
		return status || null;
	} catch (error) {
		console.error("Failed to get render status:", error);
		return null;
	}
}

export async function cancelRender(jobId: string): Promise<boolean> {
	try {
		const renderService = RenderService.getInstance();
		await renderService.cancelRender(jobId);
		return true;
	} catch (error) {
		if (error instanceof RenderError) {
			if (error.code === "JOB_NOT_FOUND") {
				return false;
			}
			throw new Error(
				`Failed to cancel render: ${error.message} (${error.code})`,
			);
		}
		throw new Error("Failed to cancel render job");
	}
}
