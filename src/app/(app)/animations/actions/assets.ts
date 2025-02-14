"use server";

import { AssetService } from "../services/asset-service";
import { type ProcessOptions, type UploadOptions } from "../types";

export async function uploadAsset(
    options: UploadOptions,
    processOptions?: ProcessOptions,
): Promise<string> {
    const assetService = AssetService.getInstance();
    return assetService.uploadAsset(options, processOptions);
}

export async function getUploadStatus(uploadId: string) {
    const assetService = AssetService.getInstance();
    return assetService.getUploadStatus(uploadId);
}

export async function cancelUpload(uploadId: string): Promise<boolean> {
    const assetService = AssetService.getInstance();
    return assetService.cancelUpload(uploadId);
}
