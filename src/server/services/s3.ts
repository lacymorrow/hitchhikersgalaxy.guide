import { env } from "@/env";
import { logger } from "@/lib/logger";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Create a single S3 client instance to be reused
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function generatePresignedUrl(fileName: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: fileName,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return signedUrl;
}

export const deleteFromS3 = async (fileName: string): Promise<void> => {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: fileName,
      }),
    );
  } catch (error) {
    logger.error("Error deleting file from S3", { error, fileName });
    throw new Error("Failed to delete file from S3");
  }
};
