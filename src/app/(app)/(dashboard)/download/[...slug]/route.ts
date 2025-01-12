import { auth } from "@/server/auth";
import { getTemporaryLinkData } from "@/server/services/temporary-links";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{
		params: paramsPromise,
	}: {
		params: Promise<{
			slug: string;
		}>;
	},
) {
	const params = await paramsPromise;
	const session = await auth();

	if (!session?.user?.id) {
		return new NextResponse(null, { status: 401 });
	}

	const data = await getTemporaryLinkData(params.slug, session.user.id);

	if (!data) {
		return new NextResponse(null, { status: 404 });
	}

	// Here you would typically stream your file or return a download URL
	// For this example, we'll just return a success response
	return NextResponse.json({ data });
}
