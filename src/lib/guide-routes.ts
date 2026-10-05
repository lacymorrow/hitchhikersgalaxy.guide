import "server-only";
import { readdir } from "fs/promises";
import { join, sep } from "path";

/**
 * First-segment static routes that shadow the `[slug]` guide catch-all.
 *
 * Any DB entry whose normalized term equals one of these (e.g. "upload",
 * "trpc", "network", "admin") renders the static route instead of the guide
 * entry. Some of those static routes are intentionally noindex (demo and
 * dashboard layouts), so advertising them as guide entries triggered Ahrefs
 * "Noindex page in sitemap" / "Orphan page" (LAC-4156). Compute the shadow
 * set from the app directory so new routes stay in sync automatically.
 */
export async function getShadowRouteSegments(): Promise<Set<string>> {
	const appDir = join(process.cwd(), "src/app");
	const segments = new Set<string>();
	try {
		const files = (await readdir(appDir, { recursive: true })) as string[];
		for (const file of files) {
			if (!file.endsWith("page.tsx") && !file.endsWith("page.mdx")) continue;
			const parts = file.split(sep);
			for (const part of parts) {
				if (part === "page.tsx" || part === "page.mdx") break;
				// Skip route groups `(x)`, dynamic params `[x]`, parallel routes
				// `@x`, and private segments `_x` — none of them contribute to
				// the URL path, so the real shadow segment is further down.
				if (
					part.startsWith("(") ||
					part.startsWith("[") ||
					part.startsWith("@") ||
					part.startsWith("_")
				) {
					continue;
				}
				segments.add(part.toLowerCase());
				break;
			}
		}
	} catch (error) {
		console.error("[guide-routes] Error scanning app directory:", error);
	}
	return segments;
}
