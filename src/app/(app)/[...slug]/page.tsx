/**
 * Unified CMS catch-all (Payload CMS + Builder.io).
 *
 * This lives under (app), not (cms), on purpose. The (cms) layout wraps its
 * children in Payload's admin RootLayout, which streams its shell and commits
 * HTTP 200 before this page can call notFound(), so every unknown URL became a
 * soft 404 whenever Payload was enabled (LAC-3870). The (app) root layout is
 * synchronous, so the existence decision below settles the status first.
 * Only /cms (admin UI) and /cms-api need Payload's RootLayout.
 */
import { env } from "@/env";
import { RenderBuilderContent } from "@/lib/builder-io/builder-io";
import { getPayloadClient } from "@/lib/payload/payload";
import type { Media, Page as PayloadPage } from "@/payload-types";
import "@/styles/builder-io.css";
import { type BuilderContent, builder } from "@builder.io/sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { PageBlock } from "@/types/blocks";
import { BlockRenderer } from "@/app/(cms)/payload-blocks";

if (env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED && env.NEXT_PUBLIC_BUILDER_API_KEY) {
  builder.init(env.NEXT_PUBLIC_BUILDER_API_KEY);
}

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
  searchParams: Promise<{
    preview?: string;
  }>;
}

function Loading() {
  return <h2>🌀 Loading...</h2>;
}

const shouldSkip = (slugString: string) => {
  return (
    slugString.startsWith("api/") ||
    slugString.includes(".") || // Any file with extension
    slugString.includes(".well-known") || // Any file with extension
    // Next.js built-in routes
    slugString.includes("manifest.json") ||
    slugString.includes("sitemap.xml") ||
    slugString.includes("robots.txt") ||
    slugString.includes("favicon.ico") ||
    // Static assets
    slugString.startsWith("_next/") ||
    slugString.startsWith("static/") ||
    // Other common static files
    slugString.endsWith(".js") ||
    slugString.endsWith(".css") ||
    slugString.endsWith(".png") ||
    slugString.endsWith(".jpg") ||
    slugString.endsWith(".jpeg") ||
    slugString.endsWith(".gif") ||
    slugString.endsWith(".svg") ||
    slugString.endsWith(".ico") ||
    slugString.endsWith(".webp") ||
    slugString.endsWith(".woff") ||
    slugString.endsWith(".woff2") ||
    slugString.endsWith(".ttf") ||
    slugString.endsWith(".eot")
  );
};

async function getPageData(
  slug: string[],
  depth = 2
): Promise<
  { source: "payload"; data: PayloadPage } | { source: "builder"; data: BuilderContent } | null
> {
  if (!env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED && !env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED) {
    return null;
  }

  const slugString = slug.join("/");
  if (shouldSkip(slugString)) {
    return null;
  }

  if (env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED) {
    try {
      const payload = await getPayloadClient();

      // First try with the joined slug
      let pageQuery = await payload?.find({
        collection: "pages",
        where: { slug: { equals: slugString } },
        depth,
      });

      // If no results, try with just the first segment of the slug
      if (pageQuery?.docs?.length === 0 && slug.length > 0) {
        pageQuery = await payload?.find({
          collection: "pages",
          where: { slug: { equals: slug[0] } },
          depth,
        });
      }

      // Try a more flexible query if still not found
      if (pageQuery?.docs?.length === 0 && slug.length > 0) {
        pageQuery = await payload?.find({
          collection: "pages",
          where: { slug: { like: slug[0] } },
          depth,
        });
      }

      if (pageQuery?.docs[0]) {
        return { source: "payload", data: pageQuery.docs[0] };
      }
    } catch (_error) {
      // Silently handle errors, as in original code
    }
  }

  if (env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED) {
    try {
      const slugString = slug.join("/");
      const builderContent = await builder
        .get("page", {
          userAttributes: {
            urlPath: `/${slugString}`,
          },
          prerender: false,
        })
        .toPromise();

      if (builderContent) {
        return { source: "builder", data: builderContent };
      }
    } catch (_error) {
      // Silently handle errors
    }
  }

  return null;
}

export async function generateMetadata({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: PageProps): Promise<Metadata> {
  const params = await paramsPromise;
  // const searchParams = await searchParamsPromise;
  // const isPreview = searchParams.preview === "true";

  const pageData = await getPageData(params.slug, 1);
  if (!pageData) {
    // Return empty metadata — do NOT call notFound() here.
    // Calling notFound() in generateMetadata causes Next.js to inject
    // robots:noindex automatically, which leaks onto /docs pages due to
    // this [...slug] catch-all overlapping with docs/[[...slug]].
    return {};
  }

  if (pageData.source === "builder") {
    return {
      title: pageData.data.data?.title ?? "Page",
      description: pageData.data.data?.description ?? "",
    };
  }

  if (pageData.source === "payload") {
    const { meta } = pageData.data;
    const isMedia = (image: any): image is Media =>
      image && typeof image === "object" && "url" in image;

    return {
      title: meta?.title,
      description: meta?.description,
      openGraph:
        meta?.image && isMedia(meta.image) && meta.image.url
          ? {
              images: [
                {
                  url: meta.image.url,
                  width: 1200,
                  height: 630,
                },
              ],
            }
          : undefined,
    };
  }

  return {};
}

export default async function Page({ params: paramsPromise }: PageProps) {
  const params = await paramsPromise;
  // const searchParams = await searchParamsPromise;
  // const isPreview = searchParams.preview === "true";

  const pageData = await getPageData(params.slug, 1);
  if (!pageData) {
    return notFound();
  }

  if (pageData.source === "payload" || pageData.source === "builder") {
    return (
      <Suspense fallback={<Loading />}>
        {pageData.source === "payload" && (
          <BlockRenderer blocks={(pageData.data.layout as PageBlock[]) ?? []} />
        )}

        {pageData.source === "builder" && (
          <RenderBuilderContent content={pageData.data} model="page" />
        )}
      </Suspense>
    );
  }

  notFound();
}
