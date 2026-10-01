/**
 * Clerk provider, picked up by scripts/generate-providers.ts.
 *
 * Wraps the app in `ClerkProvider` only when `AUTH_STRATEGY=clerk` and both
 * Clerk keys are set; otherwise it renders children unchanged, so installing
 * the `clerk` registry item changes nothing until the strategy is switched on.
 */
export { default } from "@/components/modules/auth/clerk-provider";
