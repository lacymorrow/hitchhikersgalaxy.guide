import { BASE_URL } from "@/config/base-url";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";

/**
 * Create a sign-in redirect URL with the given pathname
 * This utility function can be used in both Server and Client Components
 */
export function createSignInRedirectUrl(pathname: string): string {
  const url = new URL(routes.auth.signIn, BASE_URL);
  url.searchParams.set(SEARCH_PARAM_KEYS.nextUrl, pathname);
  return url.pathname + url.search;
}

/**
 * Create a sign-out redirect URL with the given pathname
 * This utility function can be used in both Server and Client Components
 */
export function createSignOutRedirectUrl(pathname: string): string {
  const url = new URL(routes.auth.signOut, BASE_URL);
  url.searchParams.set(SEARCH_PARAM_KEYS.nextUrl, pathname);
  return url.pathname + url.search;
}
