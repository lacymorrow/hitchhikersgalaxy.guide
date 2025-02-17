import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as s3GetSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { UploadResponse } from "../types";
import { logger } from "@/lib/logger";

const s3 = new S3Client({
	region: process.env.AWS_REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
	},
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "";

export async function uploadToS3(
	file: Buffer,
	fileName: string,
	contentType: string
): Promise<UploadResponse> {
	try {
		const key = `pfp/${Date.now()}-${fileName}`;

		await s3.send(
			new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: key,
				Body: file,
				ContentType: contentType,
			})
		);

		// Generate a pre-signed URL that's valid for 1 hour
		const command = new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
		});
		const url = await s3GetSignedUrl(s3, command, { expiresIn: 3600 });

		return {
			success: true,
			url,
			key,
		};
	} catch (error) {
		logger.error("S3 upload error:", error);
		return {
			success: false,
			url: "",
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

export async function deleteFromS3(key: string): Promise<boolean> {
	try {
		await s3.send(
			new DeleteObjectCommand({
				Bucket: BUCKET_NAME,
				Key: key,
			})
		);
		return true;
	} catch (error) {
		logger.error("S3 delete error:", error);
		return false;
	}
}

export async function generateSignedUrl(key: string): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
	});
	return await s3GetSignedUrl(s3, command, { expiresIn: 3600 });
}

export function getKeyFromUrl(url: string): string {
	const urlObj = new URL(url);
	const key = urlObj.pathname.slice(1); // Remove leading slash
	return key.includes(BUCKET_NAME) ? key.split("/").slice(1).join("/") : key;
}
