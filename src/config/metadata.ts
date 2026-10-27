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
//
// `satisfies` rather than a bare object: properties that arrive via a spread
// are exempt from excess-property checking, so a typo like `siteNames` here
// would type-check at every call site and just quietly emit nothing.
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
} satisfies OpenGraph;

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
	// One string, used for both the canonical and og:url. That is the actual
	// guarantee: Next resolves `alternates.canonical` and `openGraph.url`
	// through the same `resolveAbsoluteUrlWithPathname`, so identical input
	// cannot render as a mismatched pair however it is spelled.
	//
	// The homepage needs no trailing slash for the same reason. That resolver
	// returns the bare origin whenever the resolved pathname is "/" with no
	// query, so "/" and the origin are already the same output.
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

/*
 * Used only by the five auth pages, which all pass `noIndex: true`. They set no
 * canonical and render `noindex, follow`, so they sit outside both Open Graph
 * error classes and inheriting the layout's site-level card is fine for them.
 *
 * New indexable pages want `pageMetadata` above instead. If one of these ever
 * needs to be indexed, give `pageMetadata` a `noIndex` option and migrate it
 * rather than growing this.
 *
 * The former `images` option is gone: it only ever fed an Open Graph merge that
 * was commented out, and no caller passed it.
 */
type ConstructMetadataProps = Metadata & {
	noIndex?: boolean;
};

export const constructMetadata = ({
	noIndex = false,
	...metadata
}: ConstructMetadataProps = {}): Metadata => ({
	...defaultMetadata,
	...metadata,
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
