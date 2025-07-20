import { Suspense } from "react";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { WaitlistFAQ } from "./_components/waitlist-faq";
import { WaitlistHero } from "./_components/waitlist-hero";
import { WaitlistSocialProof } from "./_components/waitlist-social-proof";

export default function WaitlistPage() {
	return (
		<div className="min-h-screen">
			<WaitlistHero />
			<Suspense fallback={<SuspenseFallback />}>
				<WaitlistSocialProof />
				<WaitlistFAQ />
			</Suspense>
		</div>
	);
}

export const metadata = {
	title: "Join the Waitlist - Stop Building the Same Things Over and Over",
	description:
		"Get early access to Shipkit, the Next.js starter that saves weeks of setup time. Join 1,000+ developers who are tired of rebuilding auth, payments, and databases from scratch.",
};
