import type { Metadata } from "next";
import { PricingSectionSingle } from "@/components/blocks/pricing-section-single";
import { JsonLd } from "@/components/primitives/json-ld";
import { Link } from "@/components/primitives/link";
import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { singlePlan } from "@/content/pricing/pricing-content";
import { FAQ } from "../_shipkit-io-components/faq";
export const metadata: Metadata = constructMetadata({
  title: "Pricing - Ship Your Next.js App This Week | Shipkit",
  description:
    "$249 one-time. The complete Next.js stack with auth, payments, database, CMS, AI, and 100+ components. Lifetime updates, no recurring fees.",
  openGraph: {
    title: "Pricing - Ship Your Next.js App This Week | Shipkit",
    description:
      "$249 one-time. The complete Next.js stack with auth, payments, database, CMS, AI, and 100+ components. Lifetime updates, no recurring fees.",
    type: "website",
    siteName: "Shipkit",
    locale: "en_US",
  },
});

export default function PricingPage() {
  return (
    <div className="container mx-auto mt-header py-16">
      <JsonLd
        organization
        website={false}
        softwareSourceCode={false}
        product={{
          name: "Shipkit - Next.js SaaS Boilerplate",
          description:
            "The complete Next.js 16 stack with auth, payments, database, CMS, AI, and 100+ components. $249 one-time, lifetime updates.",
          image: `${siteConfig.url}/app/og-image.png`,
          price: "249",
          priceCurrency: "USD",
        }}
        faq={{
          questions: [
            {
              question: "What do I actually get?",
              answer:
                "A full Next.js 16 codebase with auth, database, payments, CMS, email, 100+ UI components, AI integrations, and deployment configs. You clone the repo and own the code forever.",
            },
            {
              question: "Is there a free version?",
              answer:
                "Yes — Shipkit Bones is free and open source on GitHub. The paid version adds the full stack: database, payments, CMS, AI, and 100+ premium components.",
            },
            {
              question: "Do I get updates?",
              answer:
                "Forever. You own the code, so you merge updates when you want. No recurring fees.",
            },
          ],
        }}
      />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-4 text-4xl font-bold">One price. Full stack. Ship this week.</h1>
        <p className="mb-8 text-xl text-muted-foreground">
          $249 one-time. Lifetime updates. No recurring fees.
        </p>
      </div>

      {/* Pricing Section */}
      <main className="flex-1">
        <div className="container mx-auto px-4">
          <div className="py-24 lg:pb-32">
            <PricingSectionSingle plan={singlePlan} />
          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <section className="mx-auto mt-24 max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-semibold">Common Questions</h2>
        <FAQ />
      </section>

      {/* Support Section */}
      <section className="mx-auto mt-24 max-w-2xl text-center">
        <h2 className="mb-4 text-2xl font-semibold">Questions?</h2>
        <p className="text-muted-foreground">
          Not sure if Shipkit is the right fit? <Link href={routes.contact}>Reach out</Link> and
          we&apos;ll help you figure it out.
        </p>
      </section>
    </div>
  );
}
