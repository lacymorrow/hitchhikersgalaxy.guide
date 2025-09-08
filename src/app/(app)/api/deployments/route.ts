import { type NextRequest, NextResponse } from "next/server";
import { getUserDeployments } from "@/server/actions/deployment-actions";
import { auth } from "@/server/auth";

export async function GET(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const deployments = await getUserDeployments();
		return NextResponse.json({ deployments });
	} catch (error) {
		console.error("Failed to fetch deployments:", error);
		return NextResponse.json({ error: "Failed to fetch deployments" }, { status: 500 });
	}
}
