import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { isClerkActive } from "@/lib/auth/auth-strategy";
import { clerkConfig, getClerkPublishableKey } from "@/lib/auth/clerk-config";

/**
 * Wraps the tree in `ClerkProvider` when Clerk is the active strategy
 * (`AUTH_STRATEGY=clerk` plus both keys); otherwise renders children as they
 * are. Mounted through `src/config/providers/clerk.provider.tsx`.
 *
 * Deliberately a server component: `ClerkProvider` from `@clerk/nextjs` reads
 * the request's auth state on the server so the first render already knows
 * who is signed in.
 */
interface ClerkProviderWrapperProps {
  children: ReactNode;
}

export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  if (!isClerkActive()) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={getClerkPublishableKey()}
      appearance={clerkConfig.appearance}
      signInFallbackRedirectUrl={clerkConfig.afterSignInUrl}
      signUpFallbackRedirectUrl={clerkConfig.afterSignUpUrl}
      afterSignOutUrl={clerkConfig.afterSignOutUrl}
    >
      {children}
    </ClerkProvider>
  );
}

export default ClerkProviderWrapper;
