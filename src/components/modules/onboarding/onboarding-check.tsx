"use client";

import { ResetIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { User } from "@/types/user";
import { OnboardingWizard } from "@/components/modules/onboarding/onboarding-wizard";

interface OnboardingCheckProps {
	user?: User | null;
	hasGitHubConnection?: boolean;
	hasVercelConnection?: boolean;
	hasPurchased?: boolean;
	/**
	 * Force enable the onboarding wizard even if feature flags are disabled.
	 * Useful for administrators or internal testing.
	 */
	forceEnabled?: boolean;
}

export function OnboardingCheck({
	user,
	hasGitHubConnection = false,
	hasVercelConnection = false,
	hasPurchased = false,
	forceEnabled = false,
}: OnboardingCheckProps) {
	// Allow admins (or forced contexts) to bypass feature-flag gating so they can run onboarding.
	if (
		!forceEnabled &&
		(!env.NEXT_PUBLIC_FEATURE_VERCEL_API_ENABLED || !env.NEXT_PUBLIC_FEATURE_GITHUB_API_ENABLED)
	) {
		return null;
	}

	const userId = user?.id ?? "";
	const [showOnboarding, setShowOnboarding] = useState(true);
	const [onboardingState, setOnboardingState] = useLocalStorage<{
		completed: boolean;
		currentStep: number;
		steps: Record<string, boolean>;
	} | null>(`onboarding-${userId}`, null);

	useEffect(() => {
		// Only show onboarding if:
		// 1. User has purchased the starter kit
		// 2. Onboarding hasn't been completed yet
		// 3. We have a valid userId
		if (hasPurchased && userId && (!onboardingState || !onboardingState.completed)) {
			setShowOnboarding(true);
		}
	}, [hasPurchased, userId, onboardingState]);

	const handleOnboardingComplete = () => {
		setShowOnboarding(false);
	};

	if (!showOnboarding || !user) {
		return null;
	}

	return (
		<OnboardingWizard
			user={user}
			hasGitHubConnection={hasGitHubConnection}
			hasVercelConnection={hasVercelConnection}
			onComplete={handleOnboardingComplete}
		/>
	);
}

// Separate component for the restart button
export function RestartOnboardingButton({
	user,
	hasGitHubConnection = false,
	hasVercelConnection = false,
	className = "",
	/**
	 * When true, always render the button (e.g., for admins), even if onboarding was not completed.
	 */
	forceVisible = false,
}: OnboardingCheckProps & { className?: string; forceVisible?: boolean }) {
	const [onboardingState, setOnboardingState] = useLocalStorage<{
		completed: boolean;
		currentStep: number;
		steps: Record<string, boolean>;
	} | null>(`onboarding-${user?.id}`, null);

	const restartOnboarding = () => {
		// Reset the onboarding state to initial values
		setOnboardingState({
			completed: false,
			currentStep: 0,
			steps: {
				github: hasGitHubConnection, // Keep GitHub connection status
				vercel: hasVercelConnection, // Keep Vercel connection status
				deploy: false,
			},
		});
		window?.location?.reload();
	};

	// Only show the button if onboarding has been completed before,
	// unless forceVisible is enabled (e.g., for admins to start onboarding).
	if (!forceVisible && !onboardingState?.completed) {
		return null;
	}

	return (
		<Button type="button" variant="ghost" onClick={restartOnboarding} className={className}>
			<ResetIcon className="mr-2 size-4" />
			{onboardingState?.completed ? "Restart Onboarding" : "Start Onboarding"}
		</Button>
	);
}
