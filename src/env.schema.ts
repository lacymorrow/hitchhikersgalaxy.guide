import { z } from "zod";

export const envSchema = z.object({
	// Core Auth
	AUTH_URL: z.string().url(),
	AUTH_SECRET: z.string().min(1),

	// OAuth Providers
	AUTH_GITHUB_ID: z.string().min(1),
	AUTH_GITHUB_SECRET: z.string().min(1),
	AUTH_DISCORD_ID: z.string().min(1),
	AUTH_DISCORD_SECRET: z.string().min(1),
	AUTH_GOOGLE_ID: z.string().min(1),
	AUTH_GOOGLE_SECRET: z.string().min(1),

	// Database
	DATABASE_URL: z.string().min(1),

	// Email
	AUTH_RESEND_KEY: z.string().min(1),

	// Payments
	LEMONSQUEEZY_API_KEY: z.string().min(1),
	LEMONSQUEEZY_STORE_ID: z.string().min(1),
	LEMONSQUEEZY_WEBHOOK_SECRET: z.string().min(1),

	// CMS
	PAYLOAD_SECRET: z.string().min(1),

	// Node Environment
	NODE_ENV: z.enum(["development", "test", "production"]),
});

export type Env = z.infer<typeof envSchema>;
