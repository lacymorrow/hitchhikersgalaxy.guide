import { NextResponse } from "next/server";
import * as tf from "@tensorflow/tfjs";
import * as faceDetection from "@tensorflow-models/face-detection";
import sharp from "sharp";
import { logger } from "@/lib/logger";

const FACE_PADDING = 0.3; // 30% padding around the face

export async function POST(request: Request) {
	try {
		// Initialize TensorFlow and load the face detection model
		await tf.ready();
		const model = await faceDetection.createDetector(
			faceDetection.SupportedModels.MediaPipeFaceDetector,
			{
				runtime: "tfjs",
				maxFaces: 1, // We only need one face for profile pictures
			}
		);

		// Get the image buffer from the request
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const buffer = Buffer.from(await file.arrayBuffer());

		// Convert image to tensor
		const imageData = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

		const tensor = tf.tensor4d(new Float32Array(imageData.data), [
			1,
			imageData.info.height,
			imageData.info.width,
			4,
		]);

		// Detect face
		const faces = await model.detectFaces(tensor);

		if (!faces.length) {
			return NextResponse.json({ error: "No face detected in the image" }, { status: 400 });
		}

		// Get the face bounding box
		const face = faces[0];
		const box = face.box;

		// Calculate the face region with padding
		const width = box.width;
		const height = box.height;
		const centerX = box.xMin + width / 2;
		const centerY = box.yMin + height / 2;

		// Calculate new dimensions with padding
		const maxDimension = Math.max(width, height);
		const paddedSize = maxDimension * (1 + FACE_PADDING);

		// Calculate new bounds ensuring they stay within image dimensions
		const xMin = Math.max(0, centerX - paddedSize / 2);
		const yMin = Math.max(0, centerY - paddedSize / 2);
		const xMax = Math.min(imageData.info.width, centerX + paddedSize / 2);
		const yMax = Math.min(imageData.info.height, centerY + paddedSize / 2);

		// Crop the image to the face region
		const croppedImage = await sharp(buffer)
			.extract({
				left: Math.round(xMin),
				top: Math.round(yMin),
				width: Math.round(xMax - xMin),
				height: Math.round(yMax - yMin),
			})
			.toBuffer();

		// Clean up tensor
		tensor.dispose();

		return new NextResponse(croppedImage, {
			headers: {
				"Content-Type": "image/png",
			},
		});
	} catch (error) {
		logger.error("Face detection error:", error);
		return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
	}
}
