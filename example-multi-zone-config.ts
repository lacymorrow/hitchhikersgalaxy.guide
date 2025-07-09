import type { NextConfig } from "next";
import { buildTimeFeatureFlags } from "@/config/features-config";
import { FILE_UPLOAD_MAX_SIZE } from "@/config/file";
import { redirects } from "@/config/routes";
import { withPlugins } from "@/config/with-plugins";

const nextConfig: NextConfig = {
	env: {
		...buildTimeFeatureFlags,
		// You can add other build-time env variables here if needed
	},
	/*
	 * Redirects are located in the `src/config/routes.ts` file
	 */
	redirects,

	/*
	 * Multi-Zone Rewrites Configuration for Shipkit.io
	 * Routes different paths to separate Next.js applications
	 */
	async rewrites() {
		const multiZoneRewrites = [];

		// Documentation Zone - Routes /docs/* to a separate docs app
		// This replaces the current /docs route with a dedicated documentation application
		if (process.env.DOCS_DOMAIN) {
			multiZoneRewrites.push(
				{
					source: "/docs",
					destination: `${process.env.DOCS_DOMAIN}/docs`,
				},
				{
					source: "/docs/:path*",
					destination: `${process.env.DOCS_DOMAIN}/docs/:path*`,
				},
				{
					source: "/docs-static/:path*",
					destination: `${process.env.DOCS_DOMAIN}/docs-static/:path*`,
				}
			);
		}

		// Blog Zone - Routes /blog/* to a separate blog app
		// This enhances the current /blog route with a dedicated blog application
		if (process.env.BLOG_DOMAIN) {
			multiZoneRewrites.push(
				{
					source: "/blog",
					destination: `${process.env.BLOG_DOMAIN}/blog`,
				},
				{
					source: "/blog/:path*",
					destination: `${process.env.BLOG_DOMAIN}/blog/:path*`,
				},
				{
					source: "/blog-static/:path*",
					destination: `${process.env.BLOG_DOMAIN}/blog-static/:path*`,
				}
			);
		}

		// UI Component Library Zone - Routes /ui/* to a separate UI showcase app
		// This creates a new zone for showcasing Shipkit's UI components
		if (process.env.UI_DOMAIN) {
			multiZoneRewrites.push(
				{
					source: "/ui",
					destination: `${process.env.UI_DOMAIN}/ui`,
				},
				{
					source: "/ui/:path*",
					destination: `${process.env.UI_DOMAIN}/ui/:path*`,
				},
				{
					source: "/ui-static/:path*",
					destination: `${process.env.UI_DOMAIN}/ui-static/:path*`,
				}
			);
		}

		// Developer Tools Zone - Routes /tools/* to a separate tools app
		// This enhances the current /tools route with dedicated developer utilities
		if (process.env.TOOLS_DOMAIN) {
			multiZoneRewrites.push(
				{
					source: "/tools",
					destination: `${process.env.TOOLS_DOMAIN}/tools`,
				},
				{
					source: "/tools/:path*",
					destination: `${process.env.TOOLS_DOMAIN}/tools/:path*`,
				},
				{
					source: "/tools-static/:path*",
					destination: `${process.env.TOOLS_DOMAIN}/tools-static/:path*`,
				}
			);
		}

		return multiZoneRewrites;
	},

	/*
	 * Next.js configuration (existing configuration continues below)
	 */
	images: {
		remotePatterns: [
			{ hostname: "picsum.photos" }, // @dev: for testing
			{ hostname: "avatar.vercel.sh" }, // @dev: for testing
			{ hostname: "github.com" }, // @dev: for testing
			{ hostname: "images.unsplash.com" }, // @dev: for testing
			{ hostname: "2.gravatar.com" }, // @dev: for testing
			{ hostname: "avatars.githubusercontent.com" }, // @dev: github avatars
			{ hostname: "vercel.com" }, // @dev: vercel button
			{
				protocol: "https",
				hostname: "**.vercel.app",
			},
			{
				protocol: "https",
				hostname: "shipkit.s3.**.amazonaws.com",
			},
			// Multi-Zone app domains for image optimization
			{
				protocol: "https",
				hostname: "docs-shipkit.vercel.app",
			},
			{
				protocol: "https",
				hostname: "blog-shipkit.vercel.app",
			},
			{
				protocol: "https",
				hostname: "ui-shipkit.vercel.app",
			},
			{
				protocol: "https",
				hostname: "tools-shipkit.vercel.app",
			},
		],
	},

	/*
	 * React configuration
	 */
	reactStrictMode: true,

	/*
	 * Source maps
	 */
	productionBrowserSourceMaps: true,

	/*
	 * Lint configuration
	 */
	eslint: {
		/*
			!! WARNING !!
			* This allows production builds to successfully complete even if
			* your project has ESLint errors.
		*/
		ignoreDuringBuilds: true,
	},
	typescript: {
		/*
			!! WARNING !!
			* Dangerously allow production builds to successfully complete even if
			* your project has type errors.
		*/
		ignoreBuildErrors: true,
	},

	// Configure `pageExtensions` to include markdown and MDX files
	pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

	/*
	 * Experimental configuration
	 */
	experimental: {
		nextScriptWorkers: true,
		serverActions: {
			bodySizeLimit: FILE_UPLOAD_MAX_SIZE,
			// Allow server actions from shipkit.io and zone domains
			allowedOrigins: [
				"https://shipkit.io",
				"https://www.shipkit.io",
				...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
				...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
				// Allow server actions from zone domains if they need to communicate back
				...(process.env.DOCS_DOMAIN ? [process.env.DOCS_DOMAIN] : []),
				...(process.env.BLOG_DOMAIN ? [process.env.BLOG_DOMAIN] : []),
				...(process.env.UI_DOMAIN ? [process.env.UI_DOMAIN] : []),
				...(process.env.TOOLS_DOMAIN ? [process.env.TOOLS_DOMAIN] : []),
			].filter(Boolean),
		},
		// @see: https://nextjs.org/docs/app/api-reference/next-config-js/viewTransition
		viewTransition: true,
		webVitalsAttribution: ["CLS", "LCP", "TTFB", "FCP", "FID"],
	},

	/*
	 * Miscellaneous configuration
	 */
	devIndicators: {
		position: "bottom-left" as const,
	},

	/*
	 * Logging configuration
	 * @see https://nextjs.org/docs/app/api-reference/next-config-js/logging
	 */
	logging: {
		fetches: {
			fullUrl: true, // This will log the full URL of the fetch request even if cached
			// hmrRefreshes: true,
		},
	},

	compiler: {
		// Remove all console logs
		// removeConsole: true
		// Remove console logs only in production, excluding error logs
		// removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,

		// Use DISABLE_LOGGING to disable all logging except error logs
		// Use DISABLE_ERROR_LOGGING to disable error logging too
		removeConsole:
			process.env.DISABLE_LOGGING === "true"
				? process.env.DISABLE_ERROR_LOGGING === "true"
					? true
					: { exclude: ["error"] }
				: false,
	},

	outputFileTracingExcludes: {
		"*": [
			"**/*.test.*",
			"**/*.spec.*",
			"**/*.stories.*",
			"**/tests/**",
			"**/.git/**",
			"**/.github/**",
			"**/.vscode/**",
			"**/.next/cache/**",
			"**/node_modules/typescript/**",
			"**/node_modules/@types/**",
			"**/node_modules/eslint/**",
			"**/node_modules/prettier/**",
			"**/node_modules/typescript/**",
			"**/node_modules/react-syntax-highlighter/**",
			"**/node_modules/canvas-confetti/**",
			"**/node_modules/@huggingface/transformers/**",
			"**/node_modules/three/**",
			"**/node_modules/@react-three/**",
			"**/node_modules/jspdf/**",
		],
	},
	outputFileTracingIncludes: {
		"*": ["./docs/**/*", "./src/content/**/*"],
	},

	async headers() {
		return [
			// /install
			{
				source: "/install",
				headers: [
					{
						key: "Cross-Origin-Opener-Policy",
						value: "same-origin",
					},
					{
						key: "Cross-Origin-Embedder-Policy",
						value: "require-corp",
					},
				],
			},
			// Add headers for multi-zone navigation if needed
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Zone-Source",
						value: "shipkit-main",
					},
				],
			},
		];
	},
};

/*
 * Apply Next.js configuration plugins using the withPlugins utility.
 * The utility handles loading and applying functions exported from files
 * in the specified directory (default: src/config/nextjs).
 */
export default withPlugins(nextConfig);
