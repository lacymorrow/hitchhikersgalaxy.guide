import { readFile } from "fs/promises";
import type { NextRequest } from "next/server";
import { join } from "path";

export const dynamic = "force-dynamic";

/**
 * Dynamic route handler for serving registry JSON files
 * @example
 * /ui/download/ui/shadcn/button.json
 * /ui/download/hooks/use-toast.json
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
	try {
		const { path } = await params;
		// Reconstruct the file path from the URL segments
		const filePath = join(process.cwd(), "src/app/ui/registry/r", ...path);

		// Ensure we're only serving JSON files from the registry
		if (!filePath.endsWith(".json") || !filePath.includes("/registry/r/")) {
			return new Response("Not Found", { status: 404 });
		}

		// Read the JSON file
		const content = await readFile(filePath, "utf-8");

		// Return the JSON with proper headers
		return new Response(content, {
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=31536000",
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch (error) {
		console.error("Failed to serve registry file:", error);
		return new Response("Not Found", { status: 404 });
	}
}
