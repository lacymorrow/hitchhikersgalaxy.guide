import { v4 as uuidv4 } from "uuid";
import { type ProcessingJob, type ProcessingQueue } from "../types";
import { ImageProcessor } from "./image-processor";
import { VideoProcessor } from "./video-processor";

export class ProcessingQueueService implements ProcessingQueue {
	private static instance: ProcessingQueueService;
	public jobs: ProcessingJob[] = [];
	private maxConcurrentJobs = 3;
	private processingJobs = 0;

	private constructor() {
		// Private constructor for singleton
		this.processNextJob();
	}

	public static getInstance(): ProcessingQueueService {
		if (!ProcessingQueueService.instance) {
			ProcessingQueueService.instance = new ProcessingQueueService();
		}
		return ProcessingQueueService.instance;
	}

	public getAllJobs(): ProcessingJob[] {
		return this.jobs;
	}

	public add(
		job: Omit<ProcessingJob, "id" | "status" | "progress" | "startedAt">,
	): void {
		const newJob: ProcessingJob = {
			...job,
			id: uuidv4(),
			status: "pending",
			progress: 0,
			startedAt: new Date(),
		};

		this.jobs.push(newJob);
		this.processNextJob();
	}

	public remove(id: string): void {
		const index = this.jobs.findIndex((job) => job.id === id);
		if (index !== -1) {
			this.jobs.splice(index, 1);
		}
	}

	public update(id: string, updates: Partial<ProcessingJob>): void {
		const job = this.jobs.find((j) => j.id === id);
		if (job) {
			Object.assign(job, updates);
		}
	}

	public getJob(id: string): ProcessingJob | undefined {
		return this.jobs.find((job) => job.id === id);
	}

	public getJobsByAsset(assetId: string): ProcessingJob[] {
		return this.jobs.filter((job) => job.assetId === assetId);
	}

	public getActiveJobs(): ProcessingJob[] {
		return this.jobs.filter((job) => job.status === "processing");
	}

	public getPendingJobs(): ProcessingJob[] {
		return this.jobs.filter((job) => job.status === "pending");
	}

	public getCompletedJobs(): ProcessingJob[] {
		return this.jobs.filter((job) => job.status === "completed");
	}

	public getFailedJobs(): ProcessingJob[] {
		return this.jobs.filter((job) => job.status === "failed");
	}

	private async processNextJob(): Promise<void> {
		if (this.processingJobs >= this.maxConcurrentJobs) {
			return;
		}

		const nextJob = this.jobs.find((job) => job.status === "pending");
		if (!nextJob) {
			return;
		}

		this.processingJobs++;
		nextJob.status = "processing";
		nextJob.startedAt = new Date();

		try {
			switch (nextJob.type) {
				case "image":
					await this.processImageJob(nextJob);
					break;
				case "video":
					await this.processVideoJob(nextJob);
					break;
			}

			nextJob.status = "completed";
			nextJob.completedAt = new Date();
			nextJob.progress = 100;
		} catch (error) {
			nextJob.status = "failed";
			nextJob.error = error instanceof Error ? error.message : String(error);
		} finally {
			this.processingJobs--;
			this.processNextJob();
		}
	}

	private async processImageJob(job: ProcessingJob): Promise<void> {
		const imageProcessor = ImageProcessor.getInstance();
		const { data, metadata } = await imageProcessor.processImage(
			Buffer.from(""), // Replace with actual input buffer
			job.options,
		);

		// TODO: Save processed image and update job output
		job.output = {
			url: "", // Replace with actual output URL
			metadata,
		};
	}

	private async processVideoJob(job: ProcessingJob): Promise<void> {
		const videoProcessor = VideoProcessor.getInstance();
		await videoProcessor.processVideo(
			"", // Replace with actual input path
			"", // Replace with actual output path
			{
				...job.options,
				video: {
					codec: "h264",
					bitrate: 2500,
					fps: 30,
				},
				audio: {
					codec: "aac",
					bitrate: 128,
					channels: 2,
					sampleRate: 44100,
				},
			},
		);

		const metadata = await videoProcessor.extractMetadata("");
		job.output = {
			url: "", // Replace with actual output URL
			metadata,
		};
	}
}
