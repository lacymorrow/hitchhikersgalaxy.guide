/**
 * Narrows a caller-supplied `nextUrl` to a same-origin path.
 *
 * Returns null for anything that could leave the site. Prefix checks on the
 * input are not enough, in both directions:
 *
 * - The URL parser strips tab, CR and LF before parsing and reads a backslash
 *   as a separator, so "/\tevil.com" and "/\evil.com" look like rooted paths
 *   but resolve off-origin. Hence the character reject below.
 * - Path normalization can *produce* an off-origin form: "/..//evil.com"
 *   normalizes to "//evil.com", which is protocol-relative. Hence the same
 *   check applied to the result.
 *
 * The Auth.js redirect callback checks the origin itself, but the better-auth
 * sign-in path calls redirect() on this value directly.
 *
 * This lives apart from lib/utils/redirect.ts so client components can use it
 * without pulling next/server into the browser bundle.
 */

/** Never a real origin, so any value that reaches a host fails the compare. */
const PROBE_ORIGIN = "https://safe-next-url.invalid";

/** C0 controls, DEL, and backslash: all dropped or rewritten by URL parsing. */
const REWRITTEN_BY_URL_PARSER = /[\u0000-\u001f\u007f\\]/;

/** A path that stays on this origin: one leading slash, and no host after it. */
function isRootedPath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

export function getSafeNextUrl(nextUrl: string | null | undefined): string | null {
  if (typeof nextUrl !== "string" || nextUrl === "") return null;
  if (REWRITTEN_BY_URL_PARSER.test(nextUrl)) return null;
  if (!isRootedPath(nextUrl)) return null;

  let resolved: URL;
  try {
    resolved = new URL(nextUrl, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (resolved.origin !== PROBE_ORIGIN) return null;

  const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;
  return isRootedPath(path) ? path : null;
}

/**
 * Narrows a caller-supplied redirect target that already has a known-safe
 * default behind it.
 *
 * Returns `undefined` when the caller supplied nothing, so the callee's own
 * default still applies, and `fallback` when the caller supplied something
 * that would leave the site. Server actions are public POST endpoints, so
 * every one of them that forwards a `redirectTo` has to run it through this
 * even when the form that calls it already checked.
 */
export function getSafeRedirectTo(redirectTo: unknown, fallback: string): string | undefined {
  if (redirectTo === undefined || redirectTo === null) return undefined;
  return getSafeNextUrl(typeof redirectTo === "string" ? redirectTo : null) ?? fallback;
}
