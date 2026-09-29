import type { Metadata, Viewport } from "next";
import type React from "react";
import { Fragment, Suspense } from "react";
import { AppRouterLayout } from "@/components/layouts/app-router-layout";
import { FontSelector } from "@/components/modules/devtools/font-selector";
import { ReactGrab } from "@/components/modules/devtools/react-grab";
import { ShipkitBranding } from "@/components/modules/shipkit-branding";
import { buildTimeFeatures } from "@/config/features-config";
import { fontSans, fontSerif } from "@/config/fonts";
import {
  metadata as defaultMetadata,
  type HeadLinkHint,
  headLinkHints,
  viewport as sharedViewport,
} from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { env } from "@/env";

export const fetchCache = "default-cache";
export const metadata: Metadata = defaultMetadata;
export const viewport: Viewport = sharedViewport;

// Only follow the payment provider import chain when a provider is enabled, so
// the provider SDKs are not pulled into every importer of this layout.
if (
  buildTimeFeatures.STRIPE_ENABLED ||
  buildTimeFeatures.LEMONSQUEEZY_ENABLED ||
  buildTimeFeatures.POLAR_ENABLED
) {
  const { initializePaymentProviders } = await import("@/server/providers");
  await initializePaymentProviders();
}

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
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted internal HTML source
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: siteConfig.title,
              description: siteConfig.description,
              url: siteConfig.url,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Person",
                name: siteConfig.creator.name,
                url: siteConfig.creator.url,
              },
              codeRepository: siteConfig.repo.url,
              programmingLanguage: ["TypeScript", "JavaScript"],
              runtimePlatform: "Node.js",
              isBasedOn: {
                "@type": "SoftwareApplication",
                name: "shipkit.io",
                url: "https://shipkit.io",
                applicationCategory: "DeveloperApplication",
              },
            }),
          }}
        />
        {headLinkHints.map((l: HeadLinkHint) => (
          <link key={`${l.rel}-${l.href}`} rel={l.rel} href={l.href} crossOrigin={l.crossOrigin} />
        ))}

        {/* shipkit.io attribution — to fully white-label, remove:
            1. This <ShipkitBranding /> component (meta tags + console log)
            2. The isBasedOn block in the JSON-LD above
            3. X-Powered-By header in next.config.ts headers()
            4. "Boilerplate: shipkit.io" line in src/app/humans.txt/route.ts
            5. generator value in src/config/site-config.ts
        */}
        <ShipkitBranding />

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
