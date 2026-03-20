import { type NextRequest, NextResponse } from "next/server";
import { GOOGLE_FONTS, type FontCategory } from "@/config/fonts";
import { env } from "@/env";

interface GoogleFontApiItem {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  category: string;
  kind: string;
}

interface GoogleFontApiResponse {
  kind: string;
  items: GoogleFontApiItem[];
}

export interface FontWithCategory {
  family: string;
  category: FontCategory;
}

const FALLBACK_STACKS: Record<string, string> = {
  "sans-serif": [
    "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont",
    '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", '"Noto Sans"', "sans-serif",
    '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"',
  ].join(", "),
  serif: [
    "ui-serif", "Georgia", "Cambria", '"Times New Roman"', "Times", "serif",
    '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"',
  ].join(", "),
  monospace: [
    "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas",
    '"Liberation Mono"', '"Courier New"', "monospace",
  ].join(", "),
  display: [
    "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont",
    '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif",
  ].join(", "),
  handwriting: [
    "cursive", "ui-sans-serif", "system-ui", "sans-serif",
  ].join(", "),
};

const DEFAULT_FALLBACK = FALLBACK_STACKS["sans-serif"];

const MAX_SEARCH_RESULTS = 25;
const BROWSE_PAGE_LIMIT = 50;

// Cache for the full font list with categories
let fullFontListCache: FontWithCategory[] | null = null;
let lastFetchTime: number | null = null;
const CACHE_DURATION = 60 * 60 * 24 * 1000; // 24 hours

async function fetchAndCacheFullFontList(apiKey: string): Promise<FontWithCategory[]> {
  const now = Date.now();
  if (fullFontListCache && lastFetchTime && now - lastFetchTime < CACHE_DURATION) {
    return fullFontListCache;
  }

  console.log("Fetching fresh full font list from Google Fonts API...");
  const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`;
  const response = await fetch(url, { next: { revalidate: 0 } });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to fetch Google Fonts (${response.status}): ${errorText}`);
    throw new Error(`Failed to fetch Google Fonts: ${response.statusText}`);
  }

  const data: GoogleFontApiResponse = await response.json();
  fullFontListCache = data.items.map((font) => ({
    family: font.family,
    category: font.category as FontCategory,
  }));
  lastFetchTime = now;
  console.log(`Successfully fetched and cached ${fullFontListCache.length} Google Font families.`);
  return fullFontListCache;
}

export async function GET(request: NextRequest) {
  const apiKey = env.GOOGLE_FONTS_API_KEY;
  const searchParams = request.nextUrl.searchParams;
  const searchQuery = searchParams.get("search")?.trim().toLowerCase();
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  const limit = Number.parseInt(searchParams.get("limit") || String(BROWSE_PAGE_LIMIT), 10);

  if (!apiKey) {
    console.warn(
      "Google Fonts API key is missing. Falling back to curated list. Add GOOGLE_FONTS_API_KEY to .env.local to enable full font search."
    );
    return NextResponse.json({
      fonts: GOOGLE_FONTS,
      families: GOOGLE_FONTS.map((f) => f.family),
      fallbackStacks: FALLBACK_STACKS,
      fallback: DEFAULT_FALLBACK,
      hasMore: false,
      isCurated: true,
    });
  }

  try {
    const allFonts = await fetchAndCacheFullFontList(apiKey);

    let responseFonts: FontWithCategory[] = [];
    let hasMore = false;

    if (searchQuery && searchQuery.length > 0) {
      responseFonts = allFonts
        .filter((font) => font.family.toLowerCase().includes(searchQuery))
        .slice(0, MAX_SEARCH_RESULTS);
      hasMore = false;
    } else {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      responseFonts = allFonts.slice(startIndex, endIndex);
      hasMore = endIndex < allFonts.length;
    }

    return NextResponse.json({
      fonts: responseFonts,
      families: responseFonts.map((f) => f.family),
      fallbackStacks: FALLBACK_STACKS,
      fallback: DEFAULT_FALLBACK,
      hasMore,
    });
  } catch (error) {
    console.error("Error processing font request:", error);
    return NextResponse.json(
      {
        fonts: [],
        families: [],
        fallbackStacks: FALLBACK_STACKS,
        fallback: DEFAULT_FALLBACK,
        error: "Failed to fetch or process fonts",
        hasMore: false,
      },
      { status: 500 }
    );
  }
}
