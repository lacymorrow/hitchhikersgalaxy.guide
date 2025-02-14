import { v4 as uuidv4 } from "uuid";

interface AnalyticsEvent {
    id: string;
    type: string;
    category: string;
    action: string;
    label?: string;
    value?: number;
    metadata?: Record<string, unknown>;
    timestamp: Date;
    sessionId: string;
    userId?: string;
}

interface PerformanceMetric {
    id: string;
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}

interface ErrorEvent {
    id: string;
    type: "error" | "warning";
    message: string;
    stack?: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
    sessionId: string;
    userId?: string;
}

export class AnalyticsService {
    private static instance: AnalyticsService;
    private sessionId: string;
    private events: AnalyticsEvent[] = [];
    private metrics: PerformanceMetric[] = [];
    private errors: ErrorEvent[] = [];
    private flushInterval: NodeJS.Timeout | null = null;
    private batchSize = 50;
    private flushIntervalMs = 30000; // 30 seconds

    private constructor() {
        this.sessionId = uuidv4();
        this.startFlushInterval();
    }

    public static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    // Track user interactions and feature usage
    public trackEvent(
        category: string,
        action: string,
        label?: string,
        value?: number,
        metadata?: Record<string, unknown>,
    ): void {
        const event: AnalyticsEvent = {
            id: uuidv4(),
            type: "event",
            category,
            action,
            label,
            value,
            metadata,
            timestamp: new Date(),
            sessionId: this.sessionId,
            userId: this.getCurrentUserId(),
        };

        this.events.push(event);
        this.checkBatchSize();
    }

    // Track performance metrics
    public trackMetric(
        name: string,
        value: number,
        unit: string,
        metadata?: Record<string, unknown>,
    ): void {
        const metric: PerformanceMetric = {
            id: uuidv4(),
            name,
            value,
            unit,
            timestamp: new Date(),
            metadata,
        };

        this.metrics.push(metric);
        this.checkBatchSize();
    }

    // Track errors and warnings
    public trackError(
        error: Error | string,
        type: "error" | "warning" = "error",
        metadata?: Record<string, unknown>,
    ): void {
        const errorEvent: ErrorEvent = {
            id: uuidv4(),
            type,
            message: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            metadata,
            timestamp: new Date(),
            sessionId: this.sessionId,
            userId: this.getCurrentUserId(),
        };

        this.errors.push(errorEvent);
        this.checkBatchSize();
    }

    // Track render performance
    public trackRenderPerformance(
        animationId: string,
        duration: number,
        success: boolean,
        metadata?: Record<string, unknown>,
    ): void {
        this.trackMetric("render_duration", duration, "ms", {
            animationId,
            success,
            ...metadata,
        });
    }

    // Track asset processing performance
    public trackProcessingPerformance(
        assetId: string,
        type: string,
        duration: number,
        success: boolean,
        metadata?: Record<string, unknown>,
    ): void {
        this.trackMetric("processing_duration", duration, "ms", {
            assetId,
            type,
            success,
            ...metadata,
        });
    }

    // Track API performance
    public trackApiPerformance(
        endpoint: string,
        method: string,
        duration: number,
        status: number,
        metadata?: Record<string, unknown>,
    ): void {
        this.trackMetric("api_duration", duration, "ms", {
            endpoint,
            method,
            status,
            ...metadata,
        });
    }

    // Track memory usage
    public trackMemoryUsage(): void {
        if (typeof window !== "undefined" && window.performance) {
            const memory = (window.performance as any).memory;
            if (memory) {
                this.trackMetric("heap_size", memory.usedJSHeapSize, "bytes", {
                    totalHeapSize: memory.totalJSHeapSize,
                    heapLimit: memory.jsHeapSizeLimit,
                });
            }
        }
    }

    // Track frame rate
    public trackFrameRate(): void {
        let lastTime = performance.now();
        let frames = 0;

        const measureFrameRate = () => {
            const currentTime = performance.now();
            frames++;

            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frames * 1000) / (currentTime - lastTime));
                this.trackMetric("frame_rate", fps, "fps");
                frames = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(measureFrameRate);
        };

        requestAnimationFrame(measureFrameRate);
    }

    private getCurrentUserId(): string | undefined {
        // Implement user ID retrieval based on your auth system
        return undefined;
    }

    private checkBatchSize(): void {
        const totalEvents =
            this.events.length + this.metrics.length + this.errors.length;
        if (totalEvents >= this.batchSize) {
            void this.flush();
        }
    }

    private startFlushInterval(): void {
        this.flushInterval = setInterval(() => {
            void this.flush();
        }, this.flushIntervalMs);
    }

    private async flush(): Promise<void> {
        const events = [...this.events];
        const metrics = [...this.metrics];
        const errors = [...this.errors];

        // Clear the arrays
        this.events = [];
        this.metrics = [];
        this.errors = [];

        try {
            // Send to your analytics backend
            await this.sendToAnalyticsBackend({
                events,
                metrics,
                errors,
            });
        } catch (error) {
            // Restore the data if sending fails
            this.events.push(...events);
            this.metrics.push(...metrics);
            this.errors.push(...errors);

            console.error("Failed to flush analytics:", error);
        }
    }

    private async sendToAnalyticsBackend(data: {
        events: AnalyticsEvent[];
        metrics: PerformanceMetric[];
        errors: ErrorEvent[];
    }): Promise<void> {
        // Implement your analytics backend integration here
        // This could be a custom endpoint, Google Analytics, Mixpanel, etc.
        console.log("Analytics data:", data);
    }

    public destroy(): void {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        void this.flush();
    }
}
