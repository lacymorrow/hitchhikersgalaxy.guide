import type { Metadata } from "next";
import { Suspense } from "react";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { FAQ } from "../_shipkit-io-components/faq";
import { FeaturesTable } from "../_shipkit-io-components/features-table";

export const metadata: Metadata = constructMetadata({
  title: `${siteConfig.title} Features - Next.js SaaS Boilerplate`,
  description:
    "Compare Shipkit features: Next.js 16, TypeScript, Payload CMS, Better Auth, AI integrations, 100+ components. The most complete Next.js SaaS starter kit.",
  openGraph: {
    title: `${siteConfig.title} Features - Next.js SaaS Boilerplate`,
    description:
      "Compare Shipkit features: Next.js 16, TypeScript, Payload CMS, Better Auth, AI integrations, 100+ components. The most complete Next.js SaaS starter kit.",
    type: "website",
    siteName: siteConfig.title,
    locale: "en_US",
  },
  keywords: [
    "Next.js boilerplate features",
    "SaaS starter kit comparison",
    "Next.js 16",
    "TypeScript",
    "Payload CMS",
    "Better Auth",
    "AI integrations",
    "Full Stack Framework",
    "Developer Tools",
    "Next.js SaaS template",
  ],
});

export default function Features() {
  return (
    <div className="container mx-auto mt-header space-y-section py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-4 text-4xl font-bold">Choose Your Plan</h1>
        <p className="mb-8 text-xl text-muted-foreground">
          Compare our plans and find the perfect fit for your project
        </p>
      </div>

      {/* Feature Comparison Table */}
      <section className="mx-auto">
        <h2 className="mb-8 text-center text-2xl font-semibold">Feature Comparison</h2>

        <div className="mx-auto max-w-screen-lg">
          <FeaturesTable />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-semibold">Frequently Asked Questions</h2>
        <Suspense fallback={<SuspenseFallback />}>
          <FAQ />
        </Suspense>
      </section>
    </div>
  );
}
