import { routes } from "@/config/routes";
import { env } from "@/env";

/**
 * Clerk configuration.
 *
 * Read by the provider (`src/config/providers/clerk.provider.tsx`), the proxy
 * (`src/proxy.ts`), the server facade (`src/server/clerk/facade.ts`) and the
 * client hooks (`src/lib/auth/clerk-client.ts`). Only used when
 * `AUTH_STRATEGY=clerk`.
 *
 * Sign-in and sign-up happen on Clerk's hosted Account Portal. The app's own
 * `/sign-in` and `/sign-up` routes stay the addresses everything links to; the
 * proxy bounces them to the portal and Clerk sends the person back to
 * `afterSignInUrl` (or the `next` query parameter) afterwards.
 */

/**
 * Both keys are present. `features-config.ts` derives
 * `NEXT_PUBLIC_FEATURE_AUTH_CLERK_ENABLED` from the same pair.
 */
export function isClerkConfigured(): boolean {
  return !!(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY);
}

/**
 * Clerk publishable key for client-side operations
 */
export function getClerkPublishableKey(): string {
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not configured");
  }
  return env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

/**
 * Clerk secret key for server-side operations
 */
export function getClerkSecretKey(): string {
  if (!env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY is not configured");
  }
  return env.CLERK_SECRET_KEY;
}

/**
 * Clerk webhook signing secret (dashboard.clerk.com, Webhooks), if set.
 */
export function getClerkWebhookSecret(): string | undefined {
  return env.CLERK_WEBHOOK_SECRET;
}

export const clerkConfig = {
  // Appearance customization to match Shipkit's design
  appearance: {
    elements: {
      formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
      formFieldInput: "border border-input bg-background text-foreground",
      card: "bg-card text-card-foreground shadow-lg",
    },
    layout: {
      socialButtonsPlacement: "top" as const,
      showOptionalFields: false,
    },
  },
  /** In-app routes that `src/proxy.ts` forwards to Clerk's hosted pages. */
  signInUrl: routes.auth.signIn,
  signUpUrl: routes.auth.signUp,
  /** Where Clerk sends the person after signing in or up. */
  afterSignInUrl: routes.app.dashboard,
  afterSignUpUrl: routes.app.dashboard,
  /** Where sign-out lands. */
  afterSignOutUrl: routes.home,
  // Clerk dashboard redirect for user management
  userProfileUrl: routes.settings.profile,
} as const;
