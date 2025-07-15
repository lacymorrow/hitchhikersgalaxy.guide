import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";

/**
 * Create a sign-in redirect URL with the given pathname
 * This utility function can be used in both Server and Client Components
 */
export function createSignInRedirectUrl(pathname: string): string {
	const url = new URL(routes.auth.signIn, "http://localhost:3000");
	url.searchParams.set(SEARCH_PARAM_KEYS.nextUrl, pathname);
	return url.pathname + url.search;
}

/**
 * Create a sign-out redirect URL with the given pathname
 * This utility function can be used in both Server and Client Components
 */
export function createSignOutRedirectUrl(pathname: string): string {
	const url = new URL(routes.auth.signOut, "http://localhost:3000");
	url.searchParams.set(SEARCH_PARAM_KEYS.nextUrl, pathname);
	return url.pathname + url.search;
}

/**
 * Hook to get sign-in redirect URL for the current pathname
 * Only use this in Client Components
 */
export function useSignInRedirectUrl(): string {
	const pathname = usePathname();
	return createSignInRedirectUrl(pathname);
}

/**
 * Hook to get sign-out redirect URL for the current pathname
 * Only use this in Client Components
 */
export function useSignOutRedirectUrl(): string {
	const pathname = usePathname();
	return createSignOutRedirectUrl(pathname);
}
