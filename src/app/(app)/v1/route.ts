import { apiKeyService } from "@/server/services/api-key-service";
import { createLog } from "@/server/services/logs/log-service";
import { NextResponse } from "next/server";

/**
 * Extract API key from request
 * Checks both Authorization header and request body
 */
const getApiKeyFromRequest = async (
	request: Request,
): Promise<string | null> => {
	// Check Authorization header first
	const authHeader = request.headers.get("Authorization");
	if (authHeader?.startsWith("Bearer ")) {
		return authHeader.substring(7); // Remove 'Bearer ' prefix
	}

	// If no Authorization header, check request body
	try {
		const body = await request.json();
		return body?.api_key ?? body?.apiKey ?? null;
	} catch {
		return null;
	}
};

/**
 * Validate and parse timestamp
 * @param timestamp - The timestamp to validate
 * @returns A valid Date object or null if invalid
 */
const parseTimestamp = (timestamp: unknown): Date | null => {
	if (!timestamp) return null;

	try {
		if (typeof timestamp === "string") {
			const date = new Date(timestamp);
			// Check if the date is valid
			if (Number.isNaN(date.getTime())) {
				return null;
			}
			return date;
		}
		if (timestamp instanceof Date) {
			if (Number.isNaN(timestamp.getTime())) {
				return null;
			}
			return timestamp;
		}
	} catch {
		return null;
	}
	return null;
};

export async function GET(request: Request) {
	// Pull data from query params
	console.log("GET /v1 - Starting request processing");

	return NextResponse.json({ message: "Hello World" });
}

export async function POST(request: Request) {
	try {
		console.log("POST /v1 - Starting request processing");

		// Clone the request since we need to read it twice
		const clonedRequest = request.clone();

		// Get API key from either Authorization header or request body
		const apiKey = await getApiKeyFromRequest(clonedRequest);

		if (!apiKey) {
			console.log("No API key provided in request");
			return NextResponse.json(
				{ error: "API key is required" },
				{ status: 400 },
			);
		}

		// Parse the request body
		const body = await request.json();

		const { level, message, timestamp, prefix, emoji, metadata } = body;

		// Validate required fields
		if (!message) {
			console.log("Missing required fields:", { message });
			return NextResponse.json(
				{ error: "Message is required" },
				{ status: 400 },
			);
		}

		// Validate timestamp
		const parsedTimestamp = parseTimestamp(timestamp);

		try {
			// Validate API key before creating log
			await apiKeyService.validateApiKey(apiKey);
		} catch (error) {
			console.error("API key validation error:", error);
			return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
		}

		const logParams = {
			level,
			message,
			timestamp: parsedTimestamp ?? new Date(),
			prefix,
			emoji,
			metadata,
			apiKey,
		};

		await createLog(logParams);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error creating log:", error);
		if (error instanceof Error) {
			console.error("Error details:", {
				name: error.name,
				message: error.message,
				stack: error.stack,
			});
			return NextResponse.json(
				{
					error: "Failed to create log",
					details: error.message,
				},
				{ status: 500 },
			);
		}
		return NextResponse.json(
			{ error: "Failed to create log" },
			{ status: 500 },
		);
	}
}
