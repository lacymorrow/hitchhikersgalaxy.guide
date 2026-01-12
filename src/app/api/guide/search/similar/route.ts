import { guideService } from "@/server/services/guide-service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const term = searchParams.get("term");

	if (!term) {
		return NextResponse.json([], { status: 400 });
	}

	try {
		const results = await guideService.getSimilarSearches(term);
		return NextResponse.json(results);
	} catch (error) {
		console.error("[Similar Search API] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch similar searches" },
			{ status: 500 },
		);
	}
}
