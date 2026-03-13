import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Suspense } from "react";
import { MobileToc } from "@/components/modules/blog/mobile-toc";
import { TOCSkeleton } from "@/components/modules/blog/skeleton";
import { TableOfContents } from "@/components/modules/blog/table-of-contents";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { getAllDocSlugsFromFileSystem, getDocFromParams } from "@/lib/docs";
import { extractHeadings, filterHeadingsByLevel } from "@/lib/utils/extract-headings";
import { useMDXComponents } from "@/mdx-components";
import "@/styles/blog.css";

interface PageProps {
	params: Promise<{
		slug: string[];
	}>;
}

export async function generateStaticParams() {
	const slugs = await getAllDocSlugsFromFileSystem();

	return slugs.map((slug: string) => {
		// For the index page, return empty array for slug
		if (slug === "index") {
			return { slug: [] };
		}
		// For other pages, split the slug into segments
		return { slug: slug.split("/") };
	});
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const defaultMetadata = constructMetadata({
		title: `Documentation - Build Better Apps Faster | ${siteConfig.title}`,
		description: `Master app development with ${siteConfig.title}'s comprehensive documentation. Step-by-step guides, API references, and best practices for building production-ready applications.`,
		openGraph: {
			type: "article",
			siteName: `${siteConfig.title} Documentation`,
			locale: "en_US",
		},
	});

	try {
		const doc = await getDocFromParams(params);

		if (!doc) {
			return defaultMetadata;
		}

		return constructMetadata({
			title: `${doc.title} - ${siteConfig.title} Documentation`,
			description:
				doc.description ||
				`Learn how to implement ${siteConfig.title} features and best practices in your app development workflow. Detailed guides and examples included.`,
			openGraph: {
				type: "article",
				siteName: `${siteConfig.title} Documentation`,
				title: doc.title,
				description: doc.description,
				locale: "en_US",
			},
		});
	} catch {
		return defaultMetadata;
	}
}

export default async function DocsPage({ params }: PageProps) {
	const doc = await getDocFromParams(params);

	if (!doc?.content) {
		notFound();
	}

	const allHeadings = extractHeadings(doc.content);
	const tocHeadings = filterHeadingsByLevel(allHeadings, 2, 4);

	return (
		<div className="flex flex-col gap-8 lg:flex-row lg:items-start">
			{/* Main documentation content */}
			<article className="docs-content flex-1 min-w-0">
				<Suspense fallback={<SuspenseFallback />}>
					{/* Mobile table of contents */}
					<Suspense fallback={<TOCSkeleton />}>
						<MobileToc headings={tocHeadings} />
					</Suspense>

					<MDXRemote source={doc.content} components={useMDXComponents({})} />
				</Suspense>
			</article>

			{/* Desktop table of contents */}
			{tocHeadings.length > 0 && (
				<aside className="hidden xl:block w-64 shrink-0">
					<div className="blog-toc">
						<Suspense fallback={<TOCSkeleton />}>
							<TableOfContents headings={tocHeadings} />
						</Suspense>
					</div>
				</aside>
			)}
		</div>
	);
}
