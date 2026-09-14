import type { Metadata, Viewport } from "next";
import type React from "react";
import { Fragment, Suspense } from "react";
import { AppRouterLayout } from "@/components/layouts/app-router-layout";
import { FontSelector } from "@/components/modules/devtools/font-selector";
import { ReactGrab } from "@/components/modules/devtools/react-grab";
import { fontSans, fontSerif } from "@/config/fonts";
import {
  metadata as defaultMetadata,
  type HeadLinkHint,
  headLinkHints,
  viewport as sharedViewport,
} from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { env } from "@/env";
import { initializePaymentProviders } from "@/server/providers";

export const fetchCache = "default-cache";
export const metadata: Metadata = defaultMetadata;
export const viewport: Viewport = sharedViewport;

await initializePaymentProviders();

// Synchronous layout: do NOT make this async. An async layout lets React start
// streaming and commit HTTP 200 before a child page can call notFound(), so
// every unknown URL under a catch-all becomes a soft 404 (LAC-2434, LAC-3861).
export default function Layout({
  children,
  // Next passes `params` (a Promise) to every layout. Keep it out of `...slots`
  // so the empty-slot check below never enumerates it (sync-dynamic-apis warning).
  params: _params,
  ...slots
}: {
  children: React.ReactNode;
  params?: Promise<Record<string, string | string[]>>;
  [key: string]: React.ReactNode | Promise<Record<string, string | string[]>>;
}) {
  // Parallel-route slots (e.g. @modal) are synchronous ReactNodes in RSC.
  const resolvedSlots = Object.entries(slots).filter(
    ([, slot]) =>
      slot != null && !(typeof slot === "object" && Object.keys(slot as object).length === 0)
  ) as [string, React.ReactNode][];

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* The previous SoftwareApplication schema failed schema.org and Google
            rich-results validation on every page (LAC-3514): codeRepository/
            programmingLanguage/runtimePlatform are not SoftwareApplication
            properties, and this site is a content guide, not an app. */}
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted internal HTML source
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteConfig.title,
              description: siteConfig.description,
              url: siteConfig.url,
              publisher: {
                "@type": "Person",
                name: siteConfig.creator.name,
                url: siteConfig.creator.url,
              },
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${siteConfig.url}/{search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {headLinkHints.map((l: HeadLinkHint) => (
          <link key={`${l.rel}-${l.href}`} rel={l.rel} href={l.href} crossOrigin={l.crossOrigin} />
        ))}

        {env.NEXT_PUBLIC_FEATURE_DEVTOOLS_ENABLED && (
          <script
            async
            defer
            crossOrigin="anonymous"
            src="https://tweakcn.com/live-preview.min.js"
          />
        )}
      </head>
      {/* Ensure portaled UI (e.g. Radix primitives) inherits the sans-serif family */}
      <body
        className={`${fontSans.variable} ${fontSerif.variable} min-h-screen font-sans antialiased`}
      >
        <AppRouterLayout>
          <main>{children}</main>

          {/*
           * Parallel-route slots. Do NOT wrap these in <Suspense>: a boundary here
           * makes Next stream the shell and commit HTTP 200 before a child page can
           * call notFound(). @modal/default.tsx renders null synchronously and the
           * intercepted sign-in/sign-up slots are sync too, so blocking is fine.
           */}
          {resolvedSlots.map(([key, slot]) => (
            <Fragment key={`slot-${key}`}>{slot}</Fragment>
          ))}

          {/* TODO: Uncomment this when we have this working */}
          {/* Lacy Morrow vanity plate */}
          {/*<BrickMarquee />*/}
        </AppRouterLayout>

        {/* Add devtools only in development */}
        {process.env.NODE_ENV === "development" &&
          env.NEXT_PUBLIC_FEATURE_DEVTOOLS_FONT_SELECTOR_ENABLED && (
            <>
              {/* React Grab — select elements and edit with AI agents */}
              <Suspense fallback={null}>
                <ReactGrab />
              </Suspense>

              <Suspense fallback={null}>
                <FontSelector />
              </Suspense>
            </>
          )}
      </body>
    </html>
  );
}
