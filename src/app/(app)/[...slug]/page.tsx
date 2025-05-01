import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCachedContent } from "@/server/services/content-generation";
import { SafeHtml } from "@/components/primitives/safe-html";
import type { Metadata, ResolvingMetadata } from "next";
import { getConfig } from "@/app/(app)/[...slug]/config";
import { getOrGenerateContent } from "@/app/(app)/[...slug]/_actions/content-generator";
import { cookies } from "next/headers";

// Placeholder type for generated content
interface GeneratedContent {
	title: string;
	body: string;
	generatedAt?: Date;
}

// Helper function to detect search engine crawlers
function isSearchEngine(userAgent: string | null): boolean {
	if (!userAgent) return false;
	const crawlers = [
		"googlebot",
		"bingbot",
		"slurp",
		"duckduckbot",
		"baiduspider",
		"yandexbot",
		"sogou",
		"exabot",
		"facebot",
		"ia_archiver",
	];
	const lowerCaseUserAgent = userAgent.toLowerCase();
	return crawlers.some((crawler) => lowerCaseUserAgent.includes(crawler));
}

interface DynamicPageProps {
	params: Promise<{
		slug: string[];
	}>;
}

// Configure ISR (Incremental Static Regeneration)
// This ensures pages are statically generated but can be regenerated
// after the specified time period has elapsed (default: 1 day)
export const revalidate = 86400; // 24 hours in seconds

// Generate dynamic metadata for the page
export async function generateMetadata(
	{ params }: DynamicPageProps,
	parent: ResolvingMetadata
): Promise<Metadata> {
	const resolvedParams = await params;
	const slug = resolvedParams.slug.join("/");
	const config = getConfig();

	try {
		// Check if we have cached content with a title
		const contentResult = await getOrGenerateContent(slug);

		if (contentResult.success && contentResult.data) {
			const content = contentResult.data;
			const title = content.title;
			const formattedTitle = config.content.titleTemplate.replace('%s', title);

			return {
				title: formattedTitle,
				description: `${config.content.defaultDescription} about ${slug}`,
				openGraph: {
					title: formattedTitle,
					description: `${config.content.defaultDescription} about ${slug}`,
					type: "website", // Use literal string for type
				},
				twitter: {
					card: "summary_large_image", // Use literal string for card
				},
			};
		}

		// Fallback metadata if no cached content
		const fallbackTitle = `${config.content.defaultTitle} ${slug}`;
		const formattedTitle = config.content.titleTemplate.replace('%s', fallbackTitle);

		return {
			title: formattedTitle,
			description: `${config.content.defaultDescription} about ${slug}`,
			openGraph: {
				title: formattedTitle,
				description: `${config.content.defaultDescription} about ${slug}`,
				type: "website", // Use literal string for type
			},
			twitter: {
				card: "summary_large_image", // Use literal string for card
			},
		};
	} catch (error) {
		// Generic fallback if an error occurs
		return {
			title: `${config.content.defaultTitle} ${slug}`,
			description: config.content.defaultDescription,
		};
	}
}

export default async function DynamicPage({ params }: DynamicPageProps) {
	const resolvedParams = await params;
	const slug = resolvedParams.slug.join("/");

	// Get the white-label configuration
	// Try to determine client ID from cookies or other means
	let clientId: string | undefined;
	try {
		const cookieStore = await cookies();
		clientId = cookieStore.get("clientId")?.value;
	} catch (error) {
		console.log("No client ID found in cookies");
	}

	const config = getConfig(clientId);

	// This section is important for ISR to work properly
	// We use our new server action to get or generate content
	let content: GeneratedContent | null = null;
	let errorMessage: string | null = null;

	try {
		const result = await getOrGenerateContent(slug, clientId);

		if (result.success && result.data) {
			content = result.data;
		} else {
			errorMessage = result.error || "Failed to generate content";
			console.error(`Error for slug "${slug}":`, errorMessage);
		}

		// If we couldn't get content, show 404
		if (!content) {
			notFound();
		}

		// Optional: Log information about when the content was generated
		if (content.generatedAt) {
			const age = Math.floor((Date.now() - new Date(content.generatedAt).getTime()) / 1000 / 60);
			console.log(`Serving content for ${slug} generated ${age} minutes ago`);
		}

	} catch (error) {
		console.error(`Error handling content for slug "${slug}":`, error);
		notFound();
	}

	// We can also collect user-agent information, but this doesn't affect the static generation
	let isCrawler = false;
	try {
		const headersList = await headers();
		const userAgent = headersList.get("user-agent");
		isCrawler = isSearchEngine(userAgent);

		// This log will only appear in development or when the page is revalidated
		console.log(`Serving page for slug: "${slug}", User-Agent: "${userAgent}", IsCrawler: ${isCrawler}`);
	} catch (error) {
		// Headers might not be available during static generation, which is fine
		console.log("Headers not available during static generation");
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<article className="prose dark:prose-invert lg:prose-xl max-w-none">
				<h1>{content.title}</h1>
				<SafeHtml html={content.body} />

				{content.generatedAt && (
					<div className="text-xs text-gray-400 mt-10">
						Content generated on: {new Date(content.generatedAt).toLocaleString()}
					</div>
				)}
			</article>

			{/* Optional branding based on white-label config */}
			{config.branding.showPoweredBy && (
				<div className="mt-8 text-sm text-gray-500 text-center">
					{config.branding.brandingText}
				</div>
			)}

			{config.branding.customFooterText && (
				<div className="mt-2 text-xs text-gray-400 text-center">
					{config.branding.customFooterText}
				</div>
			)}
		</div>
	);
}
