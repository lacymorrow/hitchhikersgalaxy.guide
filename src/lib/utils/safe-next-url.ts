/**
 * Narrows a caller-supplied `nextUrl` to a same-origin path.
 *
 * Returns null for anything that could leave the site: an absolute URL, a
 * protocol-relative "//host", or the "/\\host" form some browsers also treat as
 * protocol-relative. The Auth.js redirect callback checks the origin itself, but
 * the better-auth sign-in path calls redirect() on this value directly.
 *
 * This lives apart from lib/utils/redirect.ts so client components can use it
 * without pulling next/server into the browser bundle.
 */
export function getSafeNextUrl(nextUrl: string | null | undefined): string | null {
	if (!nextUrl?.startsWith("/")) return null;
	if (nextUrl.startsWith("//") || nextUrl.startsWith("/\\")) return null;
	return nextUrl;
}
