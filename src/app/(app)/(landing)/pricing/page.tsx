import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import { FAQ } from "../_components/faq";
import { PricingSectionSubtle } from "../_components/pricing-section-subtle";

export const metadata: Metadata = constructMetadata({
	title: "Pricing & Plans - Start Building Today | Shipkit",
	description: "Transparent, flexible pricing for teams of all sizes. Launch your app with confidence using Shipkit's powerful features. Free tier available, no credit card required.",
	openGraph: {
		title: "Pricing & Plans - Start Building Today | Shipkit",
		description: "Transparent, flexible pricing for teams of all sizes. Launch your app with confidence using Shipkit's powerful features. Free tier available, no credit card required.",
		type: "website",
		siteName: "Shipkit",
		locale: "en_US",
	},
});

export default function PricingPage() {
	return (
		<div className="container mx-auto mt-header py-16">
			<div className="mx-auto max-w-3xl text-center">
				<h1 className="mb-4 text-4xl font-bold">Get Immediate Access</h1>
				<p className="mb-8 text-xl text-muted-foreground">
					Choose a plan and get immediate access to the app
				</p>
			</div>

			{/* Pricing Section */}
			<section>
				<h2 className="mb-12 text-center text-2xl font-semibold">
					One-time Purchase
				</h2>
				<PricingSectionSubtle />
			</section>

			{/* FAQ Section */}
			<section className="mx-auto mt-24 max-w-3xl">
				<h2 className="mb-8 text-center text-2xl font-semibold">
					Common Questions
				</h2>
				<FAQ />
			</section>

			{/* Support Section */}
			<section className="mx-auto mt-24 max-w-2xl text-center">
				<h2 className="mb-4 text-2xl font-semibold">Need Help Deciding?</h2>
				<p className="text-muted-foreground">
					Our team is here to help you choose the right plan for your needs.{" "}
					<a
						href={`mailto:${siteConfig.email.support}`}
						className="font-medium text-primary hover:underline"
					>
						Contact us
					</a>
				</p>
			</section>
		</div>
	);
}
