import { type RenderJob } from "../types";

export class RenderError extends Error {
    constructor(
        message: string,
        public readonly code: string,
    ) {
        super(message);
        this.name = "RenderError";
    }
}

export class RenderService {
    private static instance: RenderService;
    private renderQueue: Map<string, RenderJob>;
    private maxConcurrentRenders: number;
    private activeRenders: number;

    private constructor() {
        this.renderQueue = new Map();
        this.maxConcurrentRenders = 3; // Configurable limit
        this.activeRenders = 0;
    }

    public static getInstance(): RenderService {
        if (!RenderService.instance) {
            RenderService.instance = new RenderService();
        }
        return RenderService.instance;
    }

    public async queueRender(job: RenderJob): Promise<RenderJob> {
        try {
            // Validate job parameters
            this.validateRenderJob(job);

            // Check queue limits
            if (this.renderQueue.size >= 100) {
                throw new RenderError(
                    "Render queue is full. Please try again later.",
                    "QUEUE_FULL",
                );
            }

            // Add to queue
            this.renderQueue.set(job.id, {
                ...job,
                status: "queued",
                progress: 0,
                queuedAt: new Date(),
            });

            // Try to process queue
            await this.processQueue();

            return this.renderQueue.get(job.id)!;
        } catch (error) {
            if (error instanceof RenderError) {
                throw error;
            }
            throw new RenderError("Failed to queue render job", "QUEUE_ERROR");
        }
    }

    public async cancelRender(jobId: string): Promise<void> {
        const job = this.renderQueue.get(jobId);
        if (!job) {
            throw new RenderError("Render job not found", "JOB_NOT_FOUND");
        }

        if (job.status === "completed" || job.status === "failed") {
            throw new RenderError(
                "Cannot cancel completed or failed render",
                "INVALID_STATE",
            );
        }

        job.status = "cancelled";
        job.completedAt = new Date();
        this.renderQueue.set(jobId, job);

        if (job.status === "rendering") {
            this.activeRenders--;
        }

        await this.processQueue();
    }

    public getRenderStatus(jobId: string): RenderJob | undefined {
        return this.renderQueue.get(jobId);
    }

    private validateRenderJob(job: RenderJob) {
        if (!job.id) {
            throw new RenderError("Job ID is required", "INVALID_PARAMS");
        }

        if (!job.animationId) {
            throw new RenderError("Animation ID is required", "INVALID_PARAMS");
        }

        if (!job.format) {
            throw new RenderError("Output format is required", "INVALID_PARAMS");
        }

        if (!job.quality) {
            throw new RenderError("Quality setting is required", "INVALID_PARAMS");
        }

        if (!job.resolution?.width || !job.resolution.height) {
            throw new RenderError("Valid resolution is required", "INVALID_PARAMS");
        }
    }

    private async processQueue(): Promise<void> {
        if (this.activeRenders >= this.maxConcurrentRenders) {
            return;
        }

        const pendingJobs = Array.from(this.renderQueue.values()).filter(
            (job) => job.status === "queued",
        );

        for (const job of pendingJobs) {
            if (this.activeRenders >= this.maxConcurrentRenders) {
                break;
            }

            try {
                this.activeRenders++;
                job.status = "rendering";
                job.startedAt = new Date();
                this.renderQueue.set(job.id, job);

                await this.renderAnimation(job);

                job.status = "completed";
                job.completedAt = new Date();
                job.progress = 100;
                this.renderQueue.set(job.id, job);
            } catch (error) {
                job.status = "failed";
                job.completedAt = new Date();
                job.error = error instanceof Error ? error.message : "Unknown error";
                this.renderQueue.set(job.id, job);
            } finally {
                this.activeRenders--;
            }
        }
    }

    private async renderAnimation(job: RenderJob): Promise<void> {
        // Simulate rendering process with progress updates
        const totalFrames = 100; // Example
        for (let frame = 0; frame < totalFrames; frame++) {
            if (job.status === "cancelled") {
                throw new RenderError("Render cancelled", "CANCELLED");
            }

            // Update progress
            job.progress = Math.round((frame / totalFrames) * 100);
            this.renderQueue.set(job.id, job);

            // Simulate frame rendering
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
}
