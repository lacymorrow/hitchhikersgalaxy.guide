/**
 * White-label configuration for the SEO Platform.
 * This can be adjusted per client or via environment variables.
 */

interface WhiteLabelConfig {
	styling: {
		primaryColor: string;
		secondaryColor: string;
		accentColor: string;
		fontFamily: string;
	};
	branding: {
		showPoweredBy: boolean;
		customFooterText?: string;
		brandingText: string;
	};
	content: {
		defaultTitle: string;
		titleTemplate: string;
		defaultDescription: string;
		generationModel: "basic" | "standard" | "premium";
		maxRelatedKeywords: number;
	};
	seo: {
		defaultMetaTags: Record<string, string>;
		customHeadScripts?: string[];
		structuredData: boolean;
	};
	caching: {
		ttlSeconds: number;
		revalidateOnCrawler: boolean;
	};
}

// Default config values
const defaultConfig: WhiteLabelConfig = {
	styling: {
		primaryColor: "#3B82F6", // Blue
		secondaryColor: "#1E293B", // Dark blue
		accentColor: "#10B981", // Green
		fontFamily: "system-ui, sans-serif",
	},
	branding: {
		showPoweredBy: true,
		brandingText: "Powered by SEO Platform",
	},
	content: {
		defaultTitle: "Information about",
		titleTemplate: "%s | SEO Platform",
		defaultDescription: "Comprehensive information and resources",
		generationModel: "standard",
		maxRelatedKeywords: 5,
	},
	seo: {
		defaultMetaTags: {
			"og:type": "website",
			"twitter:card": "summary_large_image",
		},
		structuredData: true,
	},
	caching: {
		ttlSeconds: 86400, // 24 hours
		revalidateOnCrawler: true,
	},
};

// Function to get client-specific config (can be expanded to load from DB, env vars, etc.)
export function getConfig(clientId?: string): WhiteLabelConfig {
	// This would typically fetch from DB or other source based on clientId

	if (clientId === "client1") {
		return {
			...defaultConfig,
			styling: {
				...defaultConfig.styling,
				primaryColor: "#EF4444", // Red
			},
			branding: {
				...defaultConfig.branding,
				showPoweredBy: false,
				customFooterText: "© 2023 Client 1, Inc. All rights reserved.",
			},
		};
	}

	// Return default config if no specific client config is found
	return defaultConfig;
}

export default defaultConfig;
