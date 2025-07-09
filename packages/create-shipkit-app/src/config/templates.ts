import type { FeatureConfig, Template } from "../types.js";

/**
 * Available templates for ShipKit projects
 */
export const templates: Template[] = [
	{
		name: "minimal",
		description: "Minimal ShipKit setup with basic features only",
		features: ["auth-nextauth"],
		dependencies: [
			"next",
			"react",
			"react-dom",
			"typescript",
			"@types/node",
			"@types/react",
			"@types/react-dom",
			"tailwindcss",
			"autoprefixer",
			"postcss",
		],
		devDependencies: [
			"eslint",
			"eslint-config-next",
			"@typescript-eslint/eslint-plugin",
			"@typescript-eslint/parser",
		],
	},
	{
		name: "full",
		description: "Complete ShipKit setup with all core features",
		features: [
			"auth-nextauth",
			"database-postgres",
			"email-resend",
			"ui-shadcn",
			"cms-payload",
			"analytics-posthog",
		],
		dependencies: [
			"next",
			"react",
			"react-dom",
			"typescript",
			"@types/node",
			"@types/react",
			"@types/react-dom",
			"tailwindcss",
			"autoprefixer",
			"postcss",
			"next-auth",
			"drizzle-orm",
			"drizzle-kit",
			"postgres",
			"@auth/drizzle-adapter",
			"resend",
			"@radix-ui/react-slot",
			"class-variance-authority",
			"clsx",
			"tailwind-merge",
			"lucide-react",
			"payload",
			"@payloadcms/next",
			"@payloadcms/richtext-lexical",
			"posthog-js",
		],
		devDependencies: [
			"eslint",
			"eslint-config-next",
			"@typescript-eslint/eslint-plugin",
			"@typescript-eslint/parser",
			"prettier",
			"prettier-plugin-tailwindcss",
		],
	},
];

/**
 * Available features for ShipKit projects
 */
export const features: FeatureConfig[] = [
	// Authentication
	{
		name: "auth-nextauth",
		description: "NextAuth.js for authentication",
		dependencies: ["next-auth", "@auth/drizzle-adapter"],
		envVars: ["NEXTAUTH_SECRET", "NEXTAUTH_URL"],
		category: "authentication",
	},
	{
		name: "auth-stack",
		description: "Stack Auth for modern authentication",
		dependencies: ["@stackframe/stack"],
		envVars: ["STACK_PROJECT_ID", "STACK_PUBLISHABLE_CLIENT_KEY", "STACK_SECRET_SERVER_KEY"],
		category: "authentication",
	},
	{
		name: "auth-supabase",
		description: "Supabase Auth for authentication",
		dependencies: ["@supabase/ssr", "@supabase/supabase-js"],
		envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
		category: "authentication",
	},
	{
		name: "auth-clerk",
		description: "Clerk for authentication",
		dependencies: ["@clerk/nextjs"],
		envVars: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"],
		category: "authentication",
	},

	// Database
	{
		name: "database-postgres",
		description: "PostgreSQL database with Drizzle ORM",
		dependencies: ["drizzle-orm", "drizzle-kit", "postgres"],
		envVars: ["DATABASE_URL"],
		category: "database",
	},
	{
		name: "database-supabase",
		description: "Supabase database",
		dependencies: ["@supabase/ssr", "@supabase/supabase-js"],
		envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
		category: "database",
	},

	// Email
	{
		name: "email-resend",
		description: "Resend for email delivery",
		dependencies: ["resend", "@react-email/render"],
		envVars: ["RESEND_API_KEY"],
		category: "email",
	},
	{
		name: "email-sendgrid",
		description: "SendGrid for email delivery",
		dependencies: ["@sendgrid/mail"],
		envVars: ["SENDGRID_API_KEY"],
		category: "email",
	},

	// Payments
	{
		name: "payments-stripe",
		description: "Stripe for payments",
		dependencies: ["stripe"],
		envVars: ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
		category: "payments",
	},
	{
		name: "payments-lemonsqueezy",
		description: "Lemon Squeezy for payments",
		dependencies: ["@lemonsqueezy/lemonsqueezy.js"],
		envVars: ["LEMONSQUEEZY_API_KEY"],
		category: "payments",
	},

	// UI
	{
		name: "ui-shadcn",
		description: "Shadcn/UI component library",
		dependencies: [
			"@radix-ui/react-slot",
			"@radix-ui/react-icons",
			"class-variance-authority",
			"clsx",
			"tailwind-merge",
			"lucide-react",
		],
		category: "ui",
		envVars: [],
	},

	// CMS
	{
		name: "cms-payload",
		description: "Payload CMS for content management",
		dependencies: [
			"payload",
			"@payloadcms/next",
			"@payloadcms/richtext-lexical",
			"@payloadcms/db-postgres",
		],
		envVars: ["PAYLOAD_SECRET"],
		category: "cms",
	},
	{
		name: "cms-builderio",
		description: "Builder.io for visual content management",
		dependencies: ["@builder.io/react", "@builder.io/sdk"],
		envVars: ["NEXT_PUBLIC_BUILDER_API_KEY"],
		category: "cms",
	},

	// Analytics
	{
		name: "analytics-posthog",
		description: "PostHog for product analytics",
		dependencies: ["posthog-js"],
		envVars: ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"],
		category: "analytics",
	},
	{
		name: "analytics-umami",
		description: "Umami for web analytics",
		dependencies: [],
		envVars: ["NEXT_PUBLIC_UMAMI_WEBSITE_ID", "NEXT_PUBLIC_UMAMI_URL"],
		category: "analytics",
	},
];

export function getAvailableTemplates(): Template[] {
	return templates;
}

export function getAvailableFeatures(): FeatureConfig[] {
	return features;
}

export function getTemplateByName(name: string): Template | undefined {
	return templates.find((template) => template.name === name);
}

export function getFeatureByName(name: string): FeatureConfig | undefined {
	return features.find((feature) => feature.name === name);
}
