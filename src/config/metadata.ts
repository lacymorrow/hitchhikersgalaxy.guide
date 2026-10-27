import type { Metadata, Viewport } from "next";
import type { OpenGraph } from "next/dist/lib/metadata/types/opengraph-types";
import type { Twitter } from "next/dist/lib/metadata/types/twitter-types";
import { SEO_TITLE_BRAND } from "@/lib/seo";
import { siteConfig } from "./site";

// The parts of Open Graph every page shares. Next.js replaces an inherited
// `openGraph` object wholesale instead of deep-merging it, so any page that
// declares its own Open Graph silently drops the image, site name and locale
// set here. Spread this into every page-level `openGraph` (Ahrefs: 309 "Open
// Graph tags incomplete", all of them guide entry pages).
const sharedOpenGraph = {
	locale: "en_US",
	siteName: siteConfig.name,
	images: [
		{
			url: siteConfig.ogImage,
			width: 1200,
			height: 630,
			alt: siteConfig.name,
		},
	],
};

const defaultOpenGraph: OpenGraph = {
	...sharedOpenGraph,
	type: "website",
	// The site root. A page that sets its own canonical must set its own
	// `openGraph.url` too, or it inherits this one and reports the homepage as
	// its Open Graph URL (Ahrefs: 9 "OG URL not matching canonical"). Use
	// `pageMetadata` below rather than hand-writing the pair.
	url: siteConfig.url,
	title: siteConfig.title,
	description: siteConfig.description,
};

const defaultTwitter: Twitter = {
	card: "summary_large_image",
	title: siteConfig.title,
	description: siteConfig.description,
	images: [
		{
			url: siteConfig.ogImage,
			width: 1200,
			height: 630,
			alt: siteConfig.name,
		},
	],
	creator: siteConfig.creator.twitter,
};

export const defaultMetadata: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: {
		default: siteConfig.title,
		// Short brand suffix: the full 42-char site name pushed every page title
		// past Google's ~60-char SERP limit (Ahrefs "Title too long", LAC-3514).
		template: `%s | ${SEO_TITLE_BRAND}`,
	},
	description: siteConfig.description,
	applicationName: siteConfig.name,
	authors: [
		{
			name: siteConfig.creator.name,
			url: siteConfig.creator.url,
		},
	],
	creator: siteConfig.creator.name,
	publisher: siteConfig.name,
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	generator: "Next.js",
	keywords: siteConfig.metadata.keywords,
	referrer: "origin-when-cross-origin",
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	// No default canonical: a site-wide `alternates.canonical` pointed every
	// page's canonical at the homepage. Pages set their own canonical instead.
	openGraph: defaultOpenGraph,
	twitter: defaultTwitter,
	appleWebApp: {
		capable: true,
		title: siteConfig.title,
		statusBarStyle: "default",
		startupImage: [
			{
				url: "/apple-touch-icon.png",
				media: "(device-width: 768px) and (device-height: 1024px)",
			},
		],
	},
	appLinks: {
		web: {
			url: siteConfig.url,
			should_fallback: true,
		},
	},
	archives: [`${siteConfig.url}/blog`],
	assets: [`${siteConfig.url}/assets`],
	bookmarks: [`${siteConfig.url}/`],
	category: "technology",
	classification: "Business Software",
};

export const metadata: Metadata = defaultMetadata;

interface PageMetadataProps {
	/** Site-relative path, with a leading slash. `"/"` for the homepage. */
	path: string;
	/**
	 * Title relative to the `%s | brand` template, or `{ absolute }` to opt out
	 * of the brand suffix (the homepage already carries the brand).
	 */
	title: string | { absolute: string };
	description: string;
	/** Guide entries are articles; everything else is a website. */
	type?: "website" | "article";
}

/**
 * Metadata for one indexable page: canonical URL, Open Graph and Twitter card,
 * all describing the same URL and the same title.
 *
 * Both SEO defects this fixes came from writing those by hand. The canonical
 * and `og:url` were separate strings that drifted, and a page-level
 * `openGraph` replaced the layout's instead of extending it. Here the URL is
 * one string used in both places, and the shared Open Graph fields are always
 * spread in, so neither can happen again.
 *
 * Next.js does not apply the title template to `openGraph.title`, so the card
 * title is resolved here rather than left template-relative.
 */
export const pageMetadata = ({
	path,
	title,
	description,
	type = "website",
}: PageMetadataProps): Metadata => {
	// siteConfig.url has no trailing slash, and Next resolves a "/" canonical
	// to the bare origin, so the homepage must not gain one here either.
	const url = `${siteConfig.url}${path === "/" ? "" : path}`;
	const cardTitle = typeof title === "string" ? `${title} | ${SEO_TITLE_BRAND}` : title.absolute;

	return {
		title,
		description,
		alternates: { canonical: url },
		openGraph:
			type === "article"
				? { ...sharedOpenGraph, type: "article", url, title: cardTitle, description }
				: { ...sharedOpenGraph, type: "website", url, title: cardTitle, description },
		twitter: { ...defaultTwitter, title: cardTitle, description },
	};
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	themeColor: [
		{
			media: "(prefers-color-scheme: light)",
			color: siteConfig.metadata.themeColor.light,
		},
		{
			media: "(prefers-color-scheme: dark)",
			color: siteConfig.metadata.themeColor.dark,
		},
	],
};

type ConstructMetadataProps = Metadata & {
	images?: { url: string; width: number; height: number; alt: string }[];
	noIndex?: boolean;
};

export const constructMetadata = ({
	images = [],
	noIndex = false,
	...metadata
}: ConstructMetadataProps = {}): Metadata => ({
	...defaultMetadata,
	...metadata,
	// openGraph: {
	// 	...defaultOpenGraph,
	// 	title: metadata.title ?? defaultOpenGraph.title,
	// 	description: metadata.description ?? defaultOpenGraph.description,
	// 	images: images.length > 0 ? images : defaultOpenGraph.images,
	// },
	// twitter: {
	// 	...defaultTwitter,
	// 	title: metadata.title ?? defaultTwitter.title,
	// 	description: metadata.description ?? defaultTwitter.description,
	// 	images: images.length > 0 ? images : defaultTwitter.images,
	// },
	robots: noIndex ? { index: false, follow: true } : defaultMetadata.robots,
});

// Head link hints for preconnect/prefetch
export type HeadLinkHint = {
	rel: string;
	href: string;
	crossOrigin?: "" | "anonymous" | "use-credentials";
};

export const headLinkHints: HeadLinkHint[] = [
	{ rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
	{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
];

// Route-specific metadata for better CTR
export const routeMetadata = {
	home: {
		title: siteConfig.title,
		description: siteConfig.description,
	},
	faq: {
		title: `FAQ - Frequently Asked Questions | ${siteConfig.title}`,
		description: `Common questions about ${siteConfig.title}: features, pricing, setup, and what to expect.`,
	},
};
