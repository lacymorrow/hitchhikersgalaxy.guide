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
	return names.every(name => {
		const value = process.env[name];
		return typeof value === "string" && value.trim().length > 0;
	});
}

/**
 * Check if environment variable is enabled (true/1/yes/on)
 */
function isEnabled(name: string): boolean {
	const value = process.env[name]?.toLowerCase().trim();
	return ["true", "1", "yes", "on", "enable", "enabled"].includes(value || "");
}

// ======== Feature Detection =========

const buildTimeFeatures = {} as Record<string, boolean>;

// Core Features
buildTimeFeatures.DATABASE_ENABLED = hasEnv("DATABASE_URL");
buildTimeFeatures.PAYLOAD_ENABLED = buildTimeFeatures.DATABASE_ENABLED && (isEnabled("ENABLE_PAYLOAD") || hasEnv("PAYLOAD_SECRET"));
buildTimeFeatures.BUILDER_ENABLED = hasEnv("NEXT_PUBLIC_BUILDER_API_KEY");
buildTimeFeatures.MDX_ENABLED = !isEnabled("DISABLE_MDX");
buildTimeFeatures.PWA_ENABLED = !isEnabled("DISABLE_PWA");

// Authentication
buildTimeFeatures.BETTER_AUTH_ENABLED = isEnabled("BETTER_AUTH_ENABLED") || hasEnv("BETTER_AUTH_SECRET");
buildTimeFeatures.AUTH_CREDENTIALS_ENABLED = buildTimeFeatures.PAYLOAD_ENABLED && isEnabled("AUTH_CREDENTIALS_ENABLED");
buildTimeFeatures.AUTH_RESEND_ENABLED = process.env.NODE_ENV !== "production" && hasEnv("RESEND_API_KEY");
buildTimeFeatures.AUTH_CLERK_ENABLED = hasEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY");
buildTimeFeatures.AUTH_STACK_ENABLED = hasEnv("STACK_PROJECT_ID", "STACK_PUBLISHABLE_CLIENT_KEY", "STACK_SECRET_SERVER_KEY");
buildTimeFeatures.AUTH_BITBUCKET_ENABLED = hasEnv("AUTH_BITBUCKET_ID", "AUTH_BITBUCKET_SECRET");
buildTimeFeatures.AUTH_DISCORD_ENABLED = hasEnv("AUTH_DISCORD_ID", "AUTH_DISCORD_SECRET");
buildTimeFeatures.AUTH_GITHUB_ENABLED = hasEnv("AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET");
buildTimeFeatures.AUTH_GITLAB_ENABLED = hasEnv("AUTH_GITLAB_ID", "AUTH_GITLAB_SECRET");
buildTimeFeatures.AUTH_GOOGLE_ENABLED = hasEnv("AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET");
buildTimeFeatures.AUTH_TWITTER_ENABLED = hasEnv("AUTH_TWITTER_ID", "AUTH_TWITTER_SECRET");
buildTimeFeatures.AUTH_VERCEL_ENABLED = hasEnv("VERCEL_CLIENT_ID", "VERCEL_CLIENT_SECRET");
buildTimeFeatures.SUPABASE_AUTH_ENABLED = hasEnv("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY");

// External Services
buildTimeFeatures.GITHUB_API_ENABLED = hasEnv("GITHUB_ACCESS_TOKEN");
buildTimeFeatures.GOOGLE_SERVICE_ACCOUNT_ENABLED = hasEnv("GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY");
buildTimeFeatures.OPENAI_ENABLED = hasEnv("OPENAI_API_KEY");
buildTimeFeatures.ANTHROPIC_ENABLED = hasEnv("ANTHROPIC_API_KEY");

// Payment Providers
buildTimeFeatures.LEMONSQUEEZY_ENABLED = hasEnv("LEMONSQUEEZY_API_KEY", "LEMONSQUEEZY_STORE_ID");
buildTimeFeatures.POLAR_ENABLED = hasEnv("POLAR_ACCESS_TOKEN");
buildTimeFeatures.STRIPE_ENABLED = hasEnv("STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");

// Storage
buildTimeFeatures.S3_ENABLED = hasEnv("AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_BUCKET_NAME");
buildTimeFeatures.VERCEL_BLOB_ENABLED = hasEnv("VERCEL_BLOB_READ_WRITE_TOKEN");

// Infrastructure
buildTimeFeatures.REDIS_ENABLED = hasEnv("UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN");
buildTimeFeatures.VERCEL_API_ENABLED = hasEnv("VERCEL_ACCESS_TOKEN");

// Analytics
buildTimeFeatures.POSTHOG_ENABLED = hasEnv("NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST");
buildTimeFeatures.UMAMI_ENABLED = hasEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID");

// Consent Manager
buildTimeFeatures.C15T_ENABLED = hasEnv("NEXT_PUBLIC_C15T_URL");
buildTimeFeatures.CONSENT_MANAGER_ENABLED = buildTimeFeatures.C15T_ENABLED || isEnabled("ENABLE_CONSENT_MANAGER");

// Composite Features
buildTimeFeatures.FILE_UPLOAD_ENABLED = buildTimeFeatures.S3_ENABLED || buildTimeFeatures.VERCEL_BLOB_ENABLED;

// ======== Generate Feature Flags =========

export { buildTimeFeatures };

/**
 * Build-time flags for injection into client bundle via Next.js env vars
 * Use string values as process.env converts everything to strings
 */
export const buildTimeFeatureFlags = Object.fromEntries(
	Object.entries(buildTimeFeatures).map(([key, enabled]) => [
		`NEXT_PUBLIC_FEATURE_${key}`,
		String(enabled)
	])
) as Record<`NEXT_PUBLIC_FEATURE_${string}`, string>;

