import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import {
  type FeatureFlagOverrides,
  getOverrides,
  PREVIEW_COOKIE,
  parseOverridesFromParams,
  parseTruthy,
} from "@/lib/preview-flags";
import { getSafeNextUrl } from "@/lib/utils/safe-next-url";

const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours
const MAX_COOKIE_SIZE = 2048;

function secretsMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const previewSecret = env.PREVIEW_SECRET;
  if (previewSecret) {
    const token = searchParams.get("token") ?? "";
    if (!secretsMatch(token, previewSecret)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Deployed with no secret: there is no way to tell a developer from a
    // visitor, so the endpoint stays closed rather than letting anyone flip
    // flags for their own session. Covers Vercel preview builds too, which run
    // with NODE_ENV=production. Local dev keeps open access.
    console.warn("[preview-flags] PREVIEW_SECRET is not set — endpoint disabled");
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parseTruthy(searchParams.get("clear") ?? "") === true) {
    const redirectUrl = getSafeNextUrl(searchParams.get("redirect")) ?? "/";
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    response.cookies.delete(PREVIEW_COOKIE);
    return response;
  }

  const newOverrides = parseOverridesFromParams(searchParams);

  if (Object.keys(newOverrides).length === 0) {
    const current = await getOverrides();
    return NextResponse.json({
      overrides: current,
      hint: "Pass feature_flag_<name>=1|0 to set overrides. Example: ?feature_flag_database=1&feature_flag_mdx=0",
    });
  }

  const existing = await getOverrides();
  const merged: FeatureFlagOverrides = { ...existing, ...newOverrides };

  const json = JSON.stringify(merged);
  if (json.length > MAX_COOKIE_SIZE) {
    return NextResponse.json(
      { error: "Too many overrides, clear first with ?clear=1" },
      { status: 400 }
    );
  }

  const redirectUrl = getSafeNextUrl(searchParams.get("redirect")) ?? "/";
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  response.cookies.set(PREVIEW_COOKIE, json, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
