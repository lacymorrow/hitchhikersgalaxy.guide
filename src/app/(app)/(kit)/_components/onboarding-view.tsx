import { Suspense } from "react";
import { NextStepsSection } from "@/app/(app)/(kit)/_components/next-steps-section";
import { OnboardingHeader } from "@/app/(app)/(kit)/_components/onboarding-header";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";

export function OnboardingView() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Suspense fallback={<SuspenseFallback />}>
        <OnboardingHeader />
      </Suspense>

      <div className="container mx-auto max-w-screen-md space-y-12 px-4 py-8">
        {/* <Suspense fallback={<SuspenseFallback />}>
					<FeatureGrid />
				</Suspense> */}
        <NextStepsSection />
      </div>
    </div>
  );
}
