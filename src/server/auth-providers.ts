/**
 * Compatibility shim for legacy imports
 * Re-exports from the updated location at `auth-js/auth-providers-utils`.
 * This preserves older test and code imports of `@/server/auth-providers`.
 */
export {
    availableProviderIds,
    availableProviderDetails,
    enabledAuthProviders,
    isGuestOnlyMode,
    EXCLUDED_PROVIDERS_UI,
} from "@/server/auth-js/auth-providers-utils";


