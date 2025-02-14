export type AnimationCategory =
    | "primitives"
    | "effects"
    | "auth"
    | "database"
    | "api"
    | "files"
    | "users"
    | "payments"
    | "email"
    | "search"
    | "cache"
    | "websocket";

export interface AnimationMetadata {
    id: string;
    title: string;
    description: string;
    category: AnimationCategory;
    duration: number; // in seconds
    fps: number;
    width: number;
    height: number;
    thumbnailUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[]; // For better searchability
    author?: string; // For enterprise user tracking
    version?: string; // For version control
    composition?: string; // For nested compositions
    audioTrack?: string; // For audio support
    renderSettings?: {
        quality?: "draft" | "preview" | "production";
        format?: "mp4" | "gif" | "webm";
        codec?: string;
        bitrate?: number;
    };
}

export interface AnimationComponent {
    Component: React.ComponentType;
    metadata: AnimationMetadata;
}

// For enterprise features
export interface AnimationProject {
    id: string;
    name: string;
    description?: string;
    animations: string[]; // Animation IDs
    createdAt: Date;
    updatedAt: Date;
    team?: string[];
    status: "draft" | "in-progress" | "review" | "approved" | "archived";
    deadline?: Date;
    client?: string;
    brand?: {
        colors?: string[];
        fonts?: string[];
        logo?: string;
    };
}

export interface RenderJob {
    id: string;
    animationId: string;
    status: "queued" | "processing" | "completed" | "failed";
    progress: number;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    output?: {
        url: string;
        format: string;
        size: number;
        duration: number;
    };
    settings: {
        format: "mp4" | "gif" | "webm";
        quality: "draft" | "preview" | "production";
        resolution: {
            width: number;
            height: number;
        };
    };
}

export interface AnimationTemplate {
    id: string;
    name: string;
    description?: string;
    category: AnimationCategory;
    preview?: string;
    parameters: {
        name: string;
        type: "text" | "color" | "number" | "image" | "video" | "audio";
        default?: any;
        required?: boolean;
        validation?: {
            min?: number;
            max?: number;
            pattern?: string;
        };
    }[];
    composition: string; // Base composition to be customized
}

// Asset Management Types
export interface Asset {
    id: string;
    name: string;
    type: "image" | "video" | "audio" | "font" | "color";
    url: string;
    thumbnailUrl?: string;
    metadata?: {
        size?: number;
        duration?: number;
        dimensions?: {
            width: number;
            height: number;
        };
        format?: string;
        [key: string]: unknown;
    };
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AssetCollection {
    id: string;
    name: string;
    description?: string;
    assets: string[]; // Asset IDs
    type: "brand" | "project" | "template" | "shared";
    createdAt: Date;
    updatedAt: Date;
}

export interface UploadOptions {
    file: File;
    type: "image" | "video" | "audio" | "font";
    tags?: string[];
    metadata?: Record<string, unknown>;
}

export interface ProcessOptions {
    resize?: {
        width: number;
        height: number;
        maintainAspectRatio?: boolean;
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
    compress?: {
        quality?: number;
        format?: string;
    };
}

export interface ProcessingJob {
    id: string;
    assetId: string;
    type: "image" | "video" | "audio";
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    options: ProcessOptions;
    error?: string;
    startedAt: Date;
    completedAt?: Date;
    output?: {
        url: string;
        metadata: any;
    };
}

export interface ProcessingQueue {
    jobs: ProcessingJob[];
    add: (
        job: Omit<ProcessingJob, "id" | "status" | "progress" | "startedAt">,
    ) => void;
    remove: (id: string) => void;
    update: (id: string, updates: Partial<ProcessingJob>) => void;
    getJob: (id: string) => ProcessingJob | undefined;
    getJobsByAsset: (assetId: string) => ProcessingJob[];
    getActiveJobs: () => ProcessingJob[];
    getPendingJobs: () => ProcessingJob[];
    getCompletedJobs: () => ProcessingJob[];
    getFailedJobs: () => ProcessingJob[];
}
