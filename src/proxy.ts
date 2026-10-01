import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { isClerkActive } from "@/lib/auth/auth-strategy";
import { clerkConfig } from "@/lib/auth/clerk-config";

/**
 * Request proxy (Next 16's name for middleware; `middleware.ts` is deprecated).
 *
 * Clerk reads and refreshes its session cookie here, so its server `auth()`
 * works in pages, layouts, route handlers and server actions. The app's own
 * `/sign-in` and `/sign-up` routes are forwarded to Clerk's hosted Account
 * Portal with `next` (if any) as the return URL, and a signed-in visitor to
 * either route is sent on to the dashboard.
 *
 * When Clerk is not the active strategy this is a pass-through: every request
 * gets `NextResponse.next()` and nothing else runs.
 */

const isSignIn = createRouteMatcher([`${clerkConfig.signInUrl}(.*)`]);
const isSignUp = createRouteMatcher([`${clerkConfig.signUpUrl}(.*)`]);

/**
 * Pointing Clerk's own sign-in / sign-up URLs at an in-app route (to embed
 * `<ClerkSignInForm />` there) means that route must render, not forward:
 * forwarding it to itself would loop.
 */
const clerkOwnsSignInRoute = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.startsWith("/") ?? false;
const clerkOwnsSignUpRoute = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL?.startsWith("/") ?? false;

/** Same-origin paths only, so `next` cannot be an open redirect. */
const isSafePath = (value: string | null): value is string =>
  !!value && value.startsWith("/") && !value.startsWith("//");

const clerk = clerkMiddleware(async (auth, request) => {
  const signIn = isSignIn(request) && !clerkOwnsSignInRoute;
  const signUp = isSignUp(request) && !clerkOwnsSignUpRoute;
  if (!signIn && !signUp) return;

  const { userId, redirectToSignIn, redirectToSignUp } = await auth();
  const next = request.nextUrl.searchParams.get(SEARCH_PARAM_KEYS.nextUrl);
  const after = signIn ? clerkConfig.afterSignInUrl : clerkConfig.afterSignUpUrl;
  const returnBackUrl = new URL(isSafePath(next) ? next : after, request.url);

  if (userId) return NextResponse.redirect(returnBackUrl);

  return signIn ? redirectToSignIn({ returnBackUrl }) : redirectToSignUp({ returnBackUrl });
});

const passThrough = () => NextResponse.next();

export default isClerkActive() ? clerk : passThrough;

export const config = {
  matcher: [
    // Skip Next internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
