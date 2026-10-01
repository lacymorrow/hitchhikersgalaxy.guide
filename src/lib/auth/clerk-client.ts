"use client";

import { useSession as useClerkSessionResource, useUser } from "@clerk/nextjs";
import type { Session } from "next-auth";
import { useCallback, useEffect, useMemo } from "react";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { clerkConfig } from "@/lib/auth/clerk-config";
import { mapClerkSession } from "@/lib/auth/session-mapping";

/**
 * Clerk behind the `@/lib/auth/use-session` hooks.
 *
 * `useClerkSession` maps Clerk's `useUser()` and `useSession()` into the
 * `next-auth/react` `{ data, status, update }` shape, and `clerkSignIn` /
 * `clerkSignOut` give `signIn` / `signOut` their Auth.js semantics. Only
 * `use-session.ts` imports this module, and only calls into it when Clerk is
 * the active strategy, so the hooks below always run inside `ClerkProvider`.
 *
 * Sign-in goes to the app's own sign-in route with `next`; `src/proxy.ts`
 * forwards it to Clerk's hosted Account Portal. Sign-out uses the `Clerk`
 * global that `ClerkProvider` installs, since `useClerk()` is a hook and
 * `signOut` is a plain function.
 */

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface UseSessionOptions<R extends boolean> {
  required: R;
  onUnauthenticated?: () => void;
}

interface SignInOptionsLike {
  redirectTo?: string;
  callbackUrl?: string;
  redirect?: boolean;
  [key: string]: unknown;
}

interface SignOutOptionsLike {
  redirectTo?: string;
  callbackUrl?: string;
  redirect?: boolean;
}

/** What `ClerkProvider` puts on `window` once clerk-js has loaded. */
interface ClerkWindow extends Window {
  Clerk?: { signOut: () => Promise<void> };
}

const currentPage = () =>
  typeof window === "undefined" ? clerkConfig.afterSignInUrl : window.location.href;

const navigate = (url: string) => {
  if (typeof window !== "undefined") window.location.href = url;
};

/** Same-origin paths only, so `next` cannot become an open redirect. */
const toReturnPath = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (typeof window === "undefined") return undefined;
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : undefined;
  } catch {
    return undefined;
  }
};

/** The in-app sign-in route carrying `next`, which the proxy forwards to Clerk. */
export function clerkSignInUrl(nextUrl?: string): string {
  const next = toReturnPath(nextUrl);
  if (!next) return clerkConfig.signInUrl;
  const params = new URLSearchParams({ [SEARCH_PARAM_KEYS.nextUrl]: next });
  return `${clerkConfig.signInUrl}?${params.toString()}`;
}

export function useClerkSession<R extends boolean>(options?: UseSessionOptions<R>) {
  const { isLoaded, user } = useUser();
  const { session: clerkSession } = useClerkSessionResource();
  const expireAt = clerkSession?.expireAt ?? null;
  const session = useMemo(() => mapClerkSession(user ?? null, expireAt), [user, expireAt]);
  const status: SessionStatus = !isLoaded
    ? "loading"
    : session
      ? "authenticated"
      : "unauthenticated";

  const update = useCallback(async (): Promise<Session | null> => {
    if (!user) return null;
    await user.reload();
    return mapClerkSession(user, expireAt);
  }, [user, expireAt]);

  const required = options?.required === true;
  const onUnauthenticated = options?.onUnauthenticated;
  useEffect(() => {
    if (!required || status !== "unauthenticated") return;
    if (onUnauthenticated) onUnauthenticated();
    else navigate(clerkSignInUrl(currentPage()));
  }, [required, status, onUnauthenticated]);

  return { data: session, status, update };
}

/**
 * `signIn(provider, options)`: Clerk's hosted page offers every method set up
 * in the dashboard, so `provider` is ignored. `redirect: false` returns the
 * URL instead of navigating.
 */
export async function clerkSignIn(_provider?: string, options?: SignInOptionsLike) {
  const url = clerkSignInUrl(options?.redirectTo ?? options?.callbackUrl ?? currentPage());
  if (options?.redirect !== false) navigate(url);
  return { ok: true, error: undefined, code: undefined, status: 200, url };
}

/**
 * `signOut(options)`: ends the Clerk session, then navigates to
 * `callbackUrl` / `redirectTo` (default home) unless `redirect: false`.
 */
export async function clerkSignOut(options?: SignOutOptionsLike) {
  const url =
    toReturnPath(options?.redirectTo ?? options?.callbackUrl) ?? clerkConfig.afterSignOutUrl;
  if (typeof window !== "undefined") {
    await (window as ClerkWindow).Clerk?.signOut();
  }
  if (options?.redirect !== false) navigate(url);
  return { url };
}
