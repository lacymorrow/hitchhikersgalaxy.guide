export interface NavLink {
  href: string;
  label: string;
  isCurrent?: boolean;
  /** Determines visibility based on authentication status.
   * - 'authenticated': Show only if the user is logged in.
   * - 'unauthenticated': Show only if the user is logged out.
   * - undefined: Always show the link.
   */
  authVisibility?: "authenticated" | "unauthenticated";
}

// Shipkit's marketing pages (faq, features, pricing) were removed; this site's
// header links come from the layouts that render it.
export const defaultNavLinks: NavLink[] = [];
