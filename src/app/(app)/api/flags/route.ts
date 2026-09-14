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

const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours
const MAX_COOKIE_SIZE = 2048;

function safeRedirect(raw: string): string {
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

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
    console.warn(
      "[preview-flags] PREVIEW_SECRET is not set — endpoint is unauthenticated in production"
    );
  }

  if (parseTruthy(searchParams.get("clear") ?? "") === true) {
    const redirectUrl = safeRedirect(searchParams.get("redirect") ?? "/");
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

  const redirectUrl = safeRedirect(searchParams.get("redirect") ?? "/");
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
