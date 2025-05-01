import type { Metadata, Viewport } from "next";
import type { OpenGraph } from "next/dist/lib/metadata/types/opengraph-types";
import type { Twitter } from "next/dist/lib/metadata/types/twitter-types";
import { siteConfig } from "./site";

const defaultOpenGraph: OpenGraph = {
	type: "website",
	locale: "en_US",
	url: siteConfig.url,
	title: siteConfig.title,
	description: siteConfig.description,
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
		template: `%s | ${siteConfig.name}`,
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
	verification: {
		google: "YOUR_VERIFICATION_CODE",
		yandex: "your-yandex-verification",
	},
	alternates: {
		canonical: siteConfig.url,
		// languages: {
		// 	"en-US": "/en-US",
		// },
	},
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
