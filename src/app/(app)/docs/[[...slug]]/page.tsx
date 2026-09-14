import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { isHolocronProvider } from "@/config/docs-provider";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { getAllDocSlugs, getDocFromParams } from "@/lib/docs";
import { getMDXComponents } from "@/mdx-components";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export function generateStaticParams() {
  // Under the "holocron" provider these routes are proxied away by a rewrite in
  // next.config.ts, so there is nothing to prerender here.
  if (isHolocronProvider) return [];

  return getAllDocSlugs().map((slug) => ({ slug }));
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
    const page = await getDocFromParams(params);

    if (!page) {
      return defaultMetadata;
    }

    return constructMetadata({
      title: `${page.data.title} - ${siteConfig.title} Documentation`,
      description:
        page.data.description ??
        `Learn how to implement ${siteConfig.title} features and best practices in your app development workflow. Detailed guides and examples included.`,
      openGraph: {
        type: "article",
        siteName: `${siteConfig.title} Documentation`,
        title: page.data.title,
        description: page.data.description,
        locale: "en_US",
      },
    });
  } catch (_error) {
    return defaultMetadata;
  }
}

export default async function DocsPage({ params }: PageProps) {
  const page = await getDocFromParams(params);

  if (!page) {
    notFound();
  }

  // Compiled by fumadocs-mdx at build time; custom components (SiteName,
  // SecretGenerator, callouts, ...) are injected here rather than at compile time.
  const MDXContent = page.data.body;

  return (
    <article className="docs-content">
      <Suspense fallback={<SuspenseFallback />}>
        <MDXContent components={getMDXComponents({})} />
      </Suspense>
    </article>
  );
}
