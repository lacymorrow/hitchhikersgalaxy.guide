import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getTemporaryLinkData } from "@/server/services/temporary-links";

export async function GET(
  _request: NextRequest,
  {
    params: paramsPromise,
  }: {
    params: Promise<{
      slug: string[];
    }>;
  }
) {
  const params = await paramsPromise;
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 });
  }

  const linkId = params.slug.join("/");
  const data = await getTemporaryLinkData(linkId, session?.user.id);

  if (!data) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
