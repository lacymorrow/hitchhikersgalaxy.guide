import { v4 as uuidv4 } from "uuid";

interface UploadOptions {
    file: File;
    type: "image" | "video" | "audio" | "font";
    tags?: string[];
    metadata?: Record<string, unknown>;
}

interface ProcessOptions {
    resize?: {
        width?: number;
        height?: number;
        maintainAspectRatio?: boolean;
    };
    compress?: {
        quality?: number;
        format?: string;
    };
    transform?: {
        rotate?: number;
        flip?: "horizontal" | "vertical";
        crop?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    };
}

export class AssetService {
    private static instance: AssetService;
    private uploadQueue: {
        id: string;
        file: File;
        options: UploadOptions;
        processOptions?: ProcessOptions;
    }[] = [];
    private isProcessing = false;

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): AssetService {
        if (!AssetService.instance) {
            AssetService.instance = new AssetService();
        }
        return AssetService.instance;
    }

    public async uploadAsset(
        options: UploadOptions,
        processOptions?: ProcessOptions,
    ): Promise<string> {
        const uploadId = uuidv4();

        this.uploadQueue.push({
            id: uploadId,
            file: options.file,
            options,
            processOptions,
        });

        void this.processQueue();

        return uploadId;
    }

    private async processQueue() {
        if (this.isProcessing || this.uploadQueue.length === 0) return;

        this.isProcessing = true;
        const upload = this.uploadQueue[0];

        if (!upload) {
            this.isProcessing = false;
            return;
        }

        try {
            // 1. Process the file
            const processedFile = await this.processFile(
                upload.file,
                upload.processOptions,
            );

            // 2. Generate thumbnail
            const thumbnail = await this.generateThumbnail(
                processedFile,
                upload.options.type,
            );

            // 3. Upload to storage
            const url = await this.uploadToStorage(processedFile);
            const thumbnailUrl = thumbnail
                ? await this.uploadToStorage(thumbnail)
                : undefined;

            // 4. Create asset metadata
            const metadata = await this.extractMetadata(processedFile);

            // 5. Return asset data
            return {
                id: upload.id,
                url,
                thumbnailUrl,
                metadata,
            };
        } catch (error) {
            console.error("Asset processing failed:", error);
            throw error;
        } finally {
            this.uploadQueue.shift();
            this.isProcessing = false;
            void this.processQueue();
        }
    }

    private async processFile(
        file: File,
        options?: ProcessOptions,
    ): Promise<File> {
        // Simulate file processing
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return file;
    }

    private async generateThumbnail(
        file: File,
        type: UploadOptions["type"],
    ): Promise<File | null> {
        // Simulate thumbnail generation
        await new Promise((resolve) => setTimeout(resolve, 500));
        return null;
    }

    private async uploadToStorage(file: File): Promise<string> {
        // Simulate upload to storage
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return `https://example.com/assets/${file.name}`;
    }

    private async extractMetadata(file: File): Promise<Record<string, unknown>> {
        // Simulate metadata extraction
        return {
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
        };
    }

    public async getUploadStatus(uploadId: string) {
        return this.uploadQueue.find((upload) => upload.id === uploadId);
    }

    public async cancelUpload(uploadId: string): Promise<boolean> {
        const index = this.uploadQueue.findIndex(
            (upload) => upload.id === uploadId,
        );
        if (index === -1) return false;

        if (index === 0 && this.isProcessing) {
            return false;
        }

        this.uploadQueue.splice(index, 1);
        return true;
    }
}
