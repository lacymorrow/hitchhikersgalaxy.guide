interface SiteConfig {
	name: string;
	title: string;
	url: string;
	ogImage: string;
	description: string;
	behavior: {
		pageTransitions: boolean;
	};
	creator: {
		fullName: string;
		role: string;
		name: string;
		email: string;
		url: string;
		twitter: string;
		twitter_handle: string;
		domain: string;
		avatar: string;
		bio: string;
		location: string;
	};
	store: {
		domain: string;
		products: Record<string, string>;
		format: {
			buyUrl: (product: keyof typeof siteConfig.store.products) => string;
		};
	};
	links: {
		twitter: string;
		twitter_follow: string;
		x: string;
		x_follow: string;
		github: string;
	};
	app: Record<string, string>;
	repo: {
		owner: string;
		name: string;
		url: string;
		format: {
			clone: () => string;
			ssh: () => string;
		};
	};
	email: {
		support: string;
		team: string;
		noreply: string;
		domain: string;
		format: (type: Exclude<keyof typeof siteConfig.email, "format">) => string;
	};
	admin: {
		emails: string[];
		domains: string[];
		isAdmin: (email: string) => boolean;
	};
	metadata: {
		keywords: string[];
		themeColor: {
			light: string;
			dark: string;
		};
	};
}

export const siteConfig: SiteConfig = {
	behavior: {
		pageTransitions: true, // Transition between pages
	},

	name: "SEO Platform",
	title: "Dynamic Content Platform",
	url: "https://seoplatform.example",
	ogImage: "https://seoplatform.example/og",
	description: "Programmatic SEO platform with dynamic content generation for targeted keywords.",
	links: {
		twitter: "#",
		twitter_follow: "#",
		x: "#",
		x_follow: "#",
		github: "#",
	},
	repo: {
		owner: "example",
		name: "seo-platform",
		url: "https://github.com/example/seo-platform",
		format: {
			clone: () => `https://github.com/${siteConfig.repo.owner}/${siteConfig.repo.name}.git`,
			ssh: () => `git@github.com:${siteConfig.repo.owner}/${siteConfig.repo.name}.git`,
		},
	},
	email: {
		support: "support@example.com",
		team: "team@example.com",
		noreply: "noreply@example.com",
		domain: "example.com",
		format: (type: Exclude<keyof typeof siteConfig.email, "format">) => siteConfig.email[type],
	},
	creator: {
		name: "admin",
		email: "admin@example.com",
		url: "https://example.com",
		twitter: "@example",
		twitter_handle: "example",
		domain: "example.com",
		fullName: "Platform Admin",
		role: "Administrator",
		avatar: "https://via.placeholder.com/150",
		location: "Global",
		bio: "Platform administrator",
	},

	store: {
		domain: "example.com",
		products: {
			basic: "basic",
			standard: "standard",
			premium: "premium",
		},
		format: {
			buyUrl: (product: keyof typeof siteConfig.store.products) =>
				`https://${siteConfig.store.domain}/checkout/${siteConfig.store.products[product]}`,
		},
	},
	admin: {
		emails: ["admin@example.com"],
		domains: ["example.com"],
		isAdmin: (email: string) =>
			siteConfig.admin.emails.includes(email) ||
			siteConfig.admin.domains.some((domain: string) => email?.endsWith(`@${domain}`)),
	},
	metadata: {
		keywords: [
			"SEO",
			"Content Generation",
			"Dynamic Pages",
			"Keywords",
			"Search Engine Optimization",
			"AI Content",
		],
		themeColor: {
			light: "white",
			dark: "black",
		},
	},
	app: {
		apiKeyPrefix: "pk",
	},
};
