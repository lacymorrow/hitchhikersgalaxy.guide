import { OnboardingHeader } from "./_components/onboarding-header";
import { NextStepsSection } from "./_components/next-steps-section";

export default function ShipkitOnboardingPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
			<OnboardingHeader />
			<div className="container mx-auto px-4 py-8 space-y-12">
				{/* <Suspense fallback={<SuspenseFallback />}>
					<FeatureGrid />
				</Suspense> */}
				<NextStepsSection />
			</div>
		</div>
	);
}
