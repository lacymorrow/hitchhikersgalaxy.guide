export interface ImageFile {
	url: string;
	file?: File;
	name: string;
}

export interface ProcessedImage {
	originalUrl: string;
	processedUrl: string;
	backgroundColor: string;
}

export interface UploadResponse {
	success: boolean;
	url: string;
	key?: string;
	error?: string;
}

export interface ProcessImageResponse {
	success: boolean;
	url: string;
	error?: string;
}

export interface BackgroundRemovalResponse {
	success: boolean;
	url: string;
	error?: string;
}
