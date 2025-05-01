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

	name: "The Hitchhiker's Guide to the Galaxy Guide",
	title: "The Hitchhiker's Guide to the Galaxy Guide",
	url: "https://hitchhikersgalaxy.guide",
	ogImage: "/opengraph-image.png",
	description:
		"Your indispensable companion through the vast, bewildering, and often absurd universe. Don't Panic!",
	links: {
		twitter: "https://twitter.com/lacybuilds",
		twitter_follow: "https://twitter.com/intent/follow?screen_name=lacybuilds",
		x: "https://x.com/lacybuilds",
		x_follow: "https://x.com/intent/follow?screen_name=lacybuilds",
		github: "https://github.com/lacymorrow/hitchhikersgalaxy.guide",
	},
	repo: {
		owner: "lacymorrow",
		name: "hitchhikersgalaxy.guide",
		url: "https://github.com/lacymorrow/hitchhikersgalaxy.guide",
		format: {
			clone: () => `https://github.com/${siteConfig.repo.owner}/${siteConfig.repo.name}.git`,
			ssh: () => `git@github.com:${siteConfig.repo.owner}/${siteConfig.repo.name}.git`,
		},
	},
	email: {
		support: "feedback@hitchhikersgalaxy.guide",
		team: "team@hitchhikersgalaxy.guide",
		noreply: "noreply@hitchhikersgalaxy.guide",
		domain: "hitchhikersgalaxy.guide",
		format: (type: Exclude<keyof typeof siteConfig.email, "format">) => siteConfig.email[type],
	},
	creator: {
		name: "lacymorrow",
		email: "lacy@hitchhikersgalaxy.guide",
		url: "https://lacymorrow.com",
		twitter: "@lacybuilds",
		twitter_handle: "lacybuilds",
		domain: "lacymorrow.com",
		fullName: "Lacy Morrow",
		role: "Guide Curator",
		avatar: "https://avatars.githubusercontent.com/u/1311301?v=4",
		location: "Somewhere in the Galaxy",
		bio: "Trying not to panic.",
	},

	store: {
		domain: "hitchhikersgalaxy.lemonsqueezy.com",
		products: {
			towel: "product_id_towel",
		},
		format: {
			buyUrl: (product: keyof typeof siteConfig.store.products) =>
				`https://${siteConfig.store.domain}/checkout/buy/${siteConfig.store.products[product]}`,
		},
	},
	admin: {
		emails: ["lacymorrow0@gmail.com", "gojukebox@gmail.com"],
		domains: ["lacymorrow.com"],
		isAdmin: (email: string) =>
			siteConfig.admin.emails.includes(email) ||
			siteConfig.admin.domains.some((domain: string) => email?.endsWith(`@${domain}`)),
	},
	metadata: {
		keywords: [
			"Hitchhiker's Guide to the Galaxy",
			"HHGTTG",
			"Douglas Adams",
			"Sci-Fi Comedy",
			"Science Fiction",
			"Humor",
			"Space Travel",
			"42",
			"Meaning of Life",
			"Don't Panic",
			"Towel",
			"Babel Fish",
			"Vogons",
			"Arthur Dent",
			"Ford Prefect",
			"Zaphod Beeblebrox",
			"Marvin the Paranoid Android",
			"Infinite Improbability Drive",
			"Magrathea",
			"Guide",
		],
		themeColor: {
			light: "#f7f2e4",
			dark: "#1a1e2a",
		},
	},
	app: {
		apiKeyPrefix: "hg",
	},
};
