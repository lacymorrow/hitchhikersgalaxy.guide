import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";
import { logger } from "@/lib/logger";

// Initialize S3 client only if the feature is enabled
let s3Client: S3Client | null = null;
let isInitialized = false;

if (env.NEXT_PUBLIC_FEATURE_S3_ENABLED) {
	// Explicitly check required env vars for type safety, even though the flag implies they exist.
	if (!env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
		if (!isInitialized) {
			logger.error("❌ S3 feature is enabled, but required AWS credentials or region are missing.");
			isInitialized = true;
		}
	} else {
		try {
			s3Client = new S3Client({
				region: env.AWS_REGION, // Now guaranteed to be string
				credentials: {
					accessKeyId: env.AWS_ACCESS_KEY_ID, // Now guaranteed to be string
					secretAccessKey: env.AWS_SECRET_ACCESS_KEY, // Now guaranteed to be string
				},
			});
			if (!isInitialized) {
				logger.info("✅ S3 Client Initialized");
				isInitialized = true;
			}
		} catch (error) {
			if (!isInitialized) {
				logger.error("❌ Failed to initialize S3 client:", error);
				isInitialized = true;
			}
			// Keep s3Client as null if initialization fails
		}
	}
}

/**
 * Generates a presigned URL for uploading a file to S3.
 * Throws an error if S3 is not configured or enabled.
 */
export async function generatePresignedUrl(fileName: string, contentType: string) {
	if (!s3Client) {
		logger.error("Attempted to generate presigned URL but S3 is disabled or not configured.");
		throw new Error("S3 storage is not enabled or configured.");
	}

	const command = new PutObjectCommand({
		Bucket: env.AWS_BUCKET_NAME,
		Key: fileName,
		ContentType: contentType,
	});

	try {
		const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
		return signedUrl;
	} catch (error) {
		logger.error("Error generating presigned URL", { error, fileName, contentType });
		throw new Error("Failed to generate presigned URL for S3");
	}
}

/**
 * Deletes a file from S3.
 * Throws an error if S3 is not configured or enabled.
 */
export const deleteFromS3 = async (fileName: string): Promise<void> => {
	if (!s3Client) {
		logger.error("Attempted to delete from S3 but S3 is disabled or not configured.");
		throw new Error("S3 storage is not enabled or configured.");
	}

	try {
		await s3Client.send(
			new DeleteObjectCommand({
				Bucket: env.AWS_BUCKET_NAME,
				Key: fileName,
			})
		);
	} catch (error) {
		logger.error("Error deleting file from S3", { error, fileName });
		throw new Error("Failed to delete file from S3");
	}
};
