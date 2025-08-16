/**
 * Build-time Feature Flag Detection
 *
 * This file runs during the build process to detect which buildTimeFeatures are enabled
 * based on environment variables. It generates flags for injection into the client bundle.
 *
 * @note This runs BEFORE T3 Env validation, so we use raw process.env
 */

// ======== Utility Functions =========

/**
 * Check if environment variable exists and has a value
 */
function hasEnv(...names: string[]): boolean {
	return names.every((name) => {
		const value = process.env[name];
		return typeof value === "string" && value.trim().length > 0;
	});
}

/**
 * Check if environment variable is enabled (true/1/yes/on)
 */
export function envIsTrue(name: string): boolean {
	const value = process.env[name]?.toLowerCase().trim();
	return ["true", "1", "yes", "on", "enable", "enabled"].includes(value || "");
}

// ======== Feature Detection =========

const buildTimeFeatures = {} as Record<string, boolean>;

// Core Features
buildTimeFeatures.DATABASE_ENABLED = hasEnv("DATABASE_URL");
buildTimeFeatures.PAYLOAD_ENABLED =
	buildTimeFeatures.DATABASE_ENABLED && hasEnv("PAYLOAD_SECRET") && !envIsTrue("DISABLE_PAYLOAD");
buildTimeFeatures.BUILDER_ENABLED =
	hasEnv("NEXT_PUBLIC_BUILDER_API_KEY") && !envIsTrue("DISABLE_BUILDER");
buildTimeFeatures.MDX_ENABLED = !envIsTrue("DISABLE_MDX");
buildTimeFeatures.PWA_ENABLED = !envIsTrue("DISABLE_PWA");

// Authentication
buildTimeFeatures.BETTER_AUTH_ENABLED =
	hasEnv("BETTER_AUTH_SECRET") && !envIsTrue("DISABLE_BETTER_AUTH");
buildTimeFeatures.AUTH_CLERK_ENABLED =
	hasEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY") &&
	!envIsTrue("DISABLE_AUTH_CLERK");
buildTimeFeatures.AUTH_STACK_ENABLED =
	hasEnv("STACK_PROJECT_ID", "STACK_PUBLISHABLE_CLIENT_KEY", "STACK_SECRET_SERVER_KEY") &&
	!envIsTrue("DISABLE_AUTH_STACK");

buildTimeFeatures.AUTH_CREDENTIALS_ENABLED =
	buildTimeFeatures.PAYLOAD_ENABLED && !envIsTrue("DISABLE_AUTH_CREDENTIALS");
buildTimeFeatures.AUTH_RESEND_ENABLED =
	// Resend-based auth is development-only to avoid accidental email abuse in production.
	// Enable locally when `RESEND_API_KEY` is set, unless explicitly disabled.
	process.env.NODE_ENV !== "production" &&
	hasEnv("RESEND_API_KEY") &&
	!envIsTrue("DISABLE_AUTH_RESEND");
buildTimeFeatures.AUTH_BITBUCKET_ENABLED =
	hasEnv("AUTH_BITBUCKET_ID", "AUTH_BITBUCKET_SECRET") && !envIsTrue("DISABLE_AUTH_BITBUCKET");
buildTimeFeatures.AUTH_DISCORD_ENABLED =
	hasEnv("AUTH_DISCORD_ID", "AUTH_DISCORD_SECRET") && !envIsTrue("DISABLE_AUTH_DISCORD");
buildTimeFeatures.AUTH_GITHUB_ENABLED =
	hasEnv("AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET") && !envIsTrue("DISABLE_AUTH_GITHUB");
buildTimeFeatures.AUTH_GITLAB_ENABLED =
	hasEnv("AUTH_GITLAB_ID", "AUTH_GITLAB_SECRET") && !envIsTrue("DISABLE_AUTH_GITLAB");
buildTimeFeatures.AUTH_GOOGLE_ENABLED =
	hasEnv("AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET") && !envIsTrue("DISABLE_AUTH_GOOGLE");
buildTimeFeatures.AUTH_TWITTER_ENABLED =
	hasEnv("AUTH_TWITTER_ID", "AUTH_TWITTER_SECRET") && !envIsTrue("DISABLE_AUTH_TWITTER");
buildTimeFeatures.AUTH_VERCEL_ENABLED =
	hasEnv("VERCEL_CLIENT_ID", "VERCEL_CLIENT_SECRET") && !envIsTrue("DISABLE_AUTH_VERCEL");
// Explicit Guest Auth toggle (no secrets required)
buildTimeFeatures.AUTH_GUEST_ENABLED = envIsTrue("ENABLE_AUTH_GUEST");
buildTimeFeatures.SUPABASE_AUTH_ENABLED =
	hasEnv("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
	!envIsTrue("DISABLE_SUPABASE_AUTH");
buildTimeFeatures.AUTH_JS_ENABLED =
	buildTimeFeatures.AUTH_CREDENTIALS_ENABLED ||
	buildTimeFeatures.AUTH_RESEND_ENABLED ||
	buildTimeFeatures.AUTH_BITBUCKET_ENABLED ||
	buildTimeFeatures.AUTH_DISCORD_ENABLED ||
	buildTimeFeatures.AUTH_GITHUB_ENABLED ||
	buildTimeFeatures.AUTH_GITLAB_ENABLED ||
	buildTimeFeatures.AUTH_GOOGLE_ENABLED ||
	buildTimeFeatures.AUTH_TWITTER_ENABLED ||
	buildTimeFeatures.AUTH_VERCEL_ENABLED;
buildTimeFeatures.AUTH_ENABLED =
	buildTimeFeatures.AUTH_JS_ENABLED ||
	buildTimeFeatures.BETTER_AUTH_ENABLED ||
	buildTimeFeatures.AUTH_CLERK_ENABLED ||
	buildTimeFeatures.AUTH_STACK_ENABLED ||
	buildTimeFeatures.SUPABASE_AUTH_ENABLED ||
	buildTimeFeatures.AUTH_GUEST_ENABLED;

// Any real auth methods available (excludes guest and vercel account linking)
buildTimeFeatures.AUTH_METHODS_ENABLED =
	buildTimeFeatures.AUTH_CREDENTIALS_ENABLED ||
	buildTimeFeatures.AUTH_RESEND_ENABLED ||
	buildTimeFeatures.AUTH_BITBUCKET_ENABLED ||
	buildTimeFeatures.AUTH_DISCORD_ENABLED ||
	buildTimeFeatures.AUTH_GITHUB_ENABLED ||
	buildTimeFeatures.AUTH_GITLAB_ENABLED ||
	buildTimeFeatures.AUTH_GOOGLE_ENABLED ||
	buildTimeFeatures.AUTH_TWITTER_ENABLED ||
	buildTimeFeatures.BETTER_AUTH_ENABLED ||
	buildTimeFeatures.AUTH_CLERK_ENABLED ||
	buildTimeFeatures.AUTH_STACK_ENABLED ||
	buildTimeFeatures.SUPABASE_AUTH_ENABLED;

// External Services
buildTimeFeatures.GITHUB_API_ENABLED =
	hasEnv("GITHUB_ACCESS_TOKEN") && !envIsTrue("DISABLE_GITHUB_API");
buildTimeFeatures.GOOGLE_SERVICE_ACCOUNT_ENABLED =
	hasEnv("GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY") &&
	!envIsTrue("DISABLE_GOOGLE_SERVICE_ACCOUNT");
buildTimeFeatures.OPENAI_ENABLED = hasEnv("OPENAI_API_KEY") && !envIsTrue("DISABLE_OPENAI");
buildTimeFeatures.ANTHROPIC_ENABLED =
	hasEnv("ANTHROPIC_API_KEY") && !envIsTrue("DISABLE_ANTHROPIC");

// Payment Providers
buildTimeFeatures.LEMONSQUEEZY_ENABLED =
	hasEnv("LEMONSQUEEZY_API_KEY", "LEMONSQUEEZY_STORE_ID") && !envIsTrue("DISABLE_LEMONSQUEEZY");
buildTimeFeatures.POLAR_ENABLED = hasEnv("POLAR_ACCESS_TOKEN") && !envIsTrue("DISABLE_POLAR");
buildTimeFeatures.STRIPE_ENABLED =
	hasEnv("STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") && !envIsTrue("DISABLE_STRIPE");

// Storage
buildTimeFeatures.S3_ENABLED =
	hasEnv("AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_BUCKET_NAME") &&
	!envIsTrue("DISABLE_S3");
buildTimeFeatures.VERCEL_BLOB_ENABLED =
	hasEnv("VERCEL_BLOB_READ_WRITE_TOKEN") && !envIsTrue("DISABLE_VERCEL_BLOB");

// Infrastructure
buildTimeFeatures.REDIS_ENABLED =
	hasEnv("UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN") && !envIsTrue("DISABLE_REDIS");
buildTimeFeatures.VERCEL_API_ENABLED =
	hasEnv("VERCEL_ACCESS_TOKEN") && !envIsTrue("DISABLE_VERCEL_API");

// Analytics
buildTimeFeatures.POSTHOG_ENABLED =
	hasEnv("NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST") && !envIsTrue("DISABLE_POSTHOG");
buildTimeFeatures.UMAMI_ENABLED =
	hasEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID") && !envIsTrue("DISABLE_UMAMI");

// Consent Manager
buildTimeFeatures.C15T_ENABLED = hasEnv("NEXT_PUBLIC_C15T_URL") && !envIsTrue("DISABLE_C15T");
buildTimeFeatures.CONSENT_MANAGER_ENABLED =
	(buildTimeFeatures.C15T_ENABLED || envIsTrue("ENABLE_CONSENT_MANAGER")) &&
	!envIsTrue("DISABLE_CONSENT_MANAGER");

// Composite Features
buildTimeFeatures.FILE_UPLOAD_ENABLED =
	buildTimeFeatures.S3_ENABLED || buildTimeFeatures.VERCEL_BLOB_ENABLED;

// ======== Generate Feature Flags =========

export { buildTimeFeatures };

/**
 * You probably don't need to use this.
 * Build-time flags for injection into client bundle via Next.js env vars
 * Use string values as process.env converts everything to strings
 * @internal
 */
export const buildTimeFeatureFlags = Object.fromEntries(
	Object.entries(buildTimeFeatures)
		.filter(([, enabled]) => enabled)
		.map(([key]) => [`NEXT_PUBLIC_FEATURE_${key}`, "true"])
) as Record<`NEXT_PUBLIC_FEATURE_${string}`, string>;

// Always export AUTH_ENABLED regardless of its value for client-side checks
if (!buildTimeFeatureFlags.NEXT_PUBLIC_FEATURE_AUTH_ENABLED) {
	buildTimeFeatureFlags.NEXT_PUBLIC_FEATURE_AUTH_ENABLED = buildTimeFeatures.AUTH_ENABLED
		? "true"
		: "false";
}

// Always export AUTH_METHODS_ENABLED regardless of its value (used client-side)
if (!buildTimeFeatureFlags.NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED) {
	buildTimeFeatureFlags.NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED =
		buildTimeFeatures.AUTH_METHODS_ENABLED ? "true" : "false";
}
