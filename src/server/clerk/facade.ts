import { auth as clerkAuth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { clerkConfig } from "@/lib/auth/clerk-config";
import { mapClerkSession } from "@/lib/auth/session-mapping";
import { logger } from "@/lib/logger";

/**
 * Clerk behind the `@/server/auth` facade.
 *
 * Everything in the app reads sessions through `auth()` from `@/server/auth`
 * and expects the Auth.js shape (`{ user, expires }` with the augmented
 * `User`). This module produces that shape from Clerk's `auth()` and
 * `currentUser()` so the rest of the app does not know which strategy is
 * active. Clerk's `auth()` needs `clerkMiddleware()` to have run for the
 * request, which `src/proxy.ts` does whenever Clerk is the active strategy.
 *
 * Sign-in and sign-up use Clerk's hosted Account Portal. `clerkSignIn` sends
 * the person to the app's own sign-in route with a `next` parameter, and the
 * proxy forwards that route to the portal with the same return URL, so every
 * existing link to `/sign-in` behaves the same way. `auth({ protect: true })`
 * in `@/server/auth` redirects to that route too.
 */

/**
 * Current session from Clerk, in the app's shape. `null` when signed out or
 * when Clerk cannot be reached; the caller decides whether that means a
 * redirect.
 */
export async function getClerkSession(): Promise<Session | null> {
  try {
    const { userId, sessionClaims } = await clerkAuth();
    if (!userId) return null;
    const user = await currentUser();
    return mapClerkSession(user, sessionClaims?.exp ?? null);
  } catch (error) {
    logger.error("Clerk: failed to read session", error);
    return null;
  }
}

interface SignInOptions {
  redirectTo?: string;
  callbackUrl?: string;
  redirect?: boolean;
  [key: string]: unknown;
}

const toOptions = (options?: FormData | SignInOptions): SignInOptions =>
  options instanceof FormData ? Object.fromEntries(options) : (options ?? {});

/** Only same-origin paths may be used as a return URL, so `next` cannot be an open redirect. */
const isSafePath = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//");

/**
 * The in-app sign-in (or sign-up) route carrying `next`. `src/proxy.ts` turns
 * it into Clerk's hosted page with `returnBackUrl` set to the same path.
 */
export function clerkSignInUrl(nextUrl?: string, page: "signIn" | "signUp" = "signIn"): string {
  const base = page === "signUp" ? clerkConfig.signUpUrl : clerkConfig.signInUrl;
  if (!isSafePath(nextUrl)) return base;
  const params = new URLSearchParams({ [SEARCH_PARAM_KEYS.nextUrl]: nextUrl });
  return `${base}?${params.toString()}`;
}

/**
 * `signIn(provider, options)` with Auth.js semantics. Clerk's hosted page
 * offers every method configured in the dashboard, so `provider` is ignored.
 * `redirect: false` returns `{ ok, url }` instead of redirecting.
 */
export async function clerkSignIn(_provider?: string, options?: FormData | SignInOptions) {
  const opts = toOptions(options);
  const redirectTo = opts.redirectTo ?? opts.callbackUrl ?? clerkConfig.afterSignInUrl;
  const url = clerkSignInUrl(redirectTo);
  if (opts.redirect !== false) redirect(url);
  return { ok: true, url };
}

/**
 * `signOut(options)` with Auth.js semantics: revokes the current Clerk
 * session, then redirects unless `redirect: false`. Clerk's middleware sees the
 * revoked session on the next request and treats the browser as signed out.
 */
export async function clerkSignOut(options?: FormData | SignInOptions) {
  const opts = toOptions(options);
  const redirectTo = isSafePath(opts.redirectTo) ? opts.redirectTo : clerkConfig.afterSignOutUrl;
  try {
    const { sessionId } = await clerkAuth();
    if (sessionId) {
      const client = await clerkClient();
      await client.sessions.revokeSession(sessionId);
    }
  } catch (error) {
    // No session to revoke is not a failure for the person signing out.
    logger.warn("Clerk: sign-out reported an error", error);
  }
  if (opts.redirect !== false) redirect(redirectTo);
  return { url: redirectTo };
}
