import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    version: process.env.NEXT_PUBLIC_BUILD_VERSION ?? "dev",
    commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "unknown",
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? new Date().toISOString(),
  });
}
