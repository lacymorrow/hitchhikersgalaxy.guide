import { NextResponse } from "next/server";
import Replicate from "replicate";

export async function GET() {
	try {
		const replicate = new Replicate({
			auth: process.env.REPLICATE_API_KEY,
		});

		console.log("Starting test with rembg model");

		// Test image URL
		const testImage = "https://picsum.photos/200";

		const MODEL_VERSION =
			"cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";

		// Run the background removal model
		const output = await replicate.run(MODEL_VERSION, {
			input: {
				image: testImage,
			},
		});

		console.log("Model output:", output);

		return NextResponse.json({
			success: true,
			output,
			input: testImage,
		});
	} catch (error) {
		console.error("Replicate test error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				details: {
					apiKey: process.env.REPLICATE_API_KEY ? "API key is set" : "API key is missing",
					apiKeyValue: `${process.env.REPLICATE_API_KEY?.slice(0, 10)}...`, // Fixed template literal
				},
			},
			{ status: 500 }
		);
	}
}
