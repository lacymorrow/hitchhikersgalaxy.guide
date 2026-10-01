"use client";

import { SignIn, SignOutButton, SignUp, UserButton } from "@clerk/nextjs";
import { isClerkActive } from "@/lib/auth/auth-strategy";
import { clerkConfig } from "@/lib/auth/clerk-config";

/**
 * Clerk's prebuilt auth UI, themed to match the app.
 *
 * The default flow uses Clerk's hosted Account Portal (see
 * `src/lib/auth/clerk-config.ts`), so nothing renders these by default. Drop
 * `<ClerkSignInForm />` on a page to embed the form instead; hash routing keeps
 * it working on any route without a catch-all segment.
 *
 * Every component renders nothing unless Clerk is the active strategy.
 */

/**
 * Clerk Sign In Component
 */
export function ClerkSignInForm() {
  if (!isClerkActive()) return null;

  return (
    <div className="flex items-center justify-center">
      <SignIn
        routing="hash"
        appearance={clerkConfig.appearance}
        fallbackRedirectUrl={clerkConfig.afterSignInUrl}
        signUpUrl={clerkConfig.signUpUrl}
      />
    </div>
  );
}

/**
 * Clerk Sign Up Component
 */
export function ClerkSignUpForm() {
  if (!isClerkActive()) return null;

  return (
    <div className="flex items-center justify-center">
      <SignUp
        routing="hash"
        appearance={clerkConfig.appearance}
        fallbackRedirectUrl={clerkConfig.afterSignUpUrl}
        signInUrl={clerkConfig.signInUrl}
      />
    </div>
  );
}

/**
 * Clerk User Button - Shows user profile menu when authenticated
 */
export function ClerkUserButton() {
  if (!isClerkActive()) return null;

  return (
    <UserButton
      appearance={clerkConfig.appearance}
      userProfileUrl={clerkConfig.userProfileUrl}
      afterSignOutUrl={clerkConfig.afterSignOutUrl}
    />
  );
}

/**
 * Clerk Sign Out Button
 */
interface ClerkSignOutButtonProps {
  children?: React.ReactNode;
  className?: string;
}

export function ClerkSignOutButton({ children, className }: ClerkSignOutButtonProps) {
  if (!isClerkActive()) return null;

  return (
    <SignOutButton redirectUrl={clerkConfig.afterSignOutUrl}>
      {children ?? (
        <button type="button" className={className}>
          Sign Out
        </button>
      )}
    </SignOutButton>
  );
}

/**
 * Wrapper component that conditionally renders Clerk forms based on auth strategy
 */
interface ConditionalClerkComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ConditionalClerkComponent({
  children,
  fallback = null,
}: ConditionalClerkComponentProps) {
  return <>{isClerkActive() ? children : fallback}</>;
}
