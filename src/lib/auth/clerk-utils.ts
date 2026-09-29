import type { User } from "@clerk/nextjs/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { mapClerkSession } from "@/lib/auth/session-mapping";
import { logger } from "@/lib/logger";

/**
 * Server-side helpers on top of Clerk's `auth()` and `currentUser()`.
 *
 * Only used when Clerk is the active authentication strategy. App code should
 * read the session through `auth()` from `@/server/auth`, which dispatches to
 * `src/server/clerk/facade.ts`; these are for code that needs Clerk-specific
 * data (organizations, roles) the app's session shape does not carry.
 */

/**
 * Get the current authenticated user from Clerk
 */
export async function getClerkUser(): Promise<User | null> {
  try {
    return await currentUser();
  } catch (error) {
    logger.error("Clerk: failed to read the current user", error);
    return null;
  }
}

/**
 * Get the current user's session information
 */
export async function getClerkSession() {
  try {
    const { userId, sessionId, orgId } = await auth();
    return {
      userId,
      sessionId,
      orgId,
      isAuthenticated: !!userId,
    };
  } catch (error) {
    logger.error("Clerk: failed to read the session", error);
    return {
      userId: null,
      sessionId: null,
      orgId: null,
      isAuthenticated: false,
    };
  }
}

/**
 * Check if user is authenticated
 */
export async function isClerkAuthenticated(): Promise<boolean> {
  const session = await getClerkSession();
  return session.isAuthenticated;
}

/**
 * Get user ID from Clerk session
 */
export async function getClerkUserId(): Promise<string | null> {
  const session = await getClerkSession();
  return session.userId;
}

/**
 * Convert a Clerk user to the app's `User` shape (the same mapping the
 * session facade uses).
 */
export function formatClerkUser(clerkUser: User) {
  return mapClerkSession(clerkUser, null)?.user ?? null;
}

/**
 * Get formatted user data for the current authenticated user
 */
export async function getCurrentFormattedUser() {
  const clerkUser = await getClerkUser();
  if (!clerkUser) return null;
  return formatClerkUser(clerkUser);
}

/**
 * Check if user has a specific role (for organization-based auth)
 */
export async function hasClerkRole(role: string): Promise<boolean> {
  try {
    const { orgRole } = await auth();
    return orgRole === role;
  } catch (error) {
    logger.error("Clerk: failed to check the organization role", error);
    return false;
  }
}

/**
 * Check if user is an admin (for organization-based auth)
 */
export async function isClerkAdmin(): Promise<boolean> {
  return hasClerkRole("admin");
}

/**
 * Get user's organization information
 */
export async function getClerkOrganization() {
  try {
    const { orgId, orgRole, orgSlug } = await auth();
    return {
      id: orgId,
      role: orgRole,
      slug: orgSlug,
      hasOrganization: !!orgId,
    };
  } catch (error) {
    logger.error("Clerk: failed to read the organization", error);
    return {
      id: null,
      role: null,
      slug: null,
      hasOrganization: false,
    };
  }
}
