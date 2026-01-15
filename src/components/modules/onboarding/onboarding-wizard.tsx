"use client";

import { CheckIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GitHubConnectButton } from "@/components/buttons/github-connect-button";
import { VercelConnectButton } from "@/components/buttons/vercel-connect-button";
import { DashboardVercelDeploy } from "@/components/modules/deploy/dashboard-vercel-deploy";
import { IntroDisclosure } from "@/components/ui/intro-disclosure";
import { siteConfig } from "@/config/site-config";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/types/user";

interface OnboardingWizardProps {
	user: User | undefined;
	hasGitHubConnection?: boolean;
	hasVercelConnection?: boolean;
	onComplete?: () => void;
}

export const OnboardingWizard = ({
	user,
	hasGitHubConnection = false,
	hasVercelConnection = false,
	onComplete,
}: OnboardingWizardProps) => {
	const { toast } = useToast();

	const hasVercelConnectionAttempt = !!user?.vercelConnectionAttemptedAt || hasVercelConnection;

	const initialStep = hasGitHubConnection ? (hasVercelConnectionAttempt ? 2 : 1) : 0;

	const defaultOnboardingState = useMemo(
		() => ({
			completed: false,
			currentStep: initialStep,
			steps: {
				github: hasGitHubConnection,
				vercel: hasVercelConnectionAttempt,
				deploy: false,
			},
		}),
		[initialStep, hasGitHubConnection, hasVercelConnectionAttempt]
	);

	const [onboardingState, setOnboardingState] = useLocalStorage<{
		completed: boolean;
		currentStep: number;
		steps: Record<string, boolean>;
	}>(`onboarding-${user?.id ?? "guest"}`, defaultOnboardingState);

	// Defensive: ensure onboardingState is never null/undefined
	const safeOnboardingState = onboardingState ?? defaultOnboardingState;

	const [open, setOpen] = useState(!safeOnboardingState.completed);

	useEffect(() => {
		setOpen(!safeOnboardingState.completed);
	}, [safeOnboardingState.completed]);

	// Keep connection flags in sync
	useEffect(() => {
		setOnboardingState((prev) => {
			const safePrev = prev ?? defaultOnboardingState;
			return {
				...safePrev,
				steps: {
					...safePrev.steps,
					github: hasGitHubConnection,
					vercel: hasVercelConnectionAttempt,
				},
			};
		});
	}, [hasGitHubConnection, hasVercelConnectionAttempt, setOnboardingState, defaultOnboardingState]);

	const stepIds = useMemo(() => ["github", "vercel", "deploy"], []);

	// Calculate which steps should be marked as completed based on connection status
	const initialCompletedSteps = useMemo(() => {
		const completed: number[] = [];
		if (hasGitHubConnection) completed.push(0);
		if (hasVercelConnection) completed.push(1);
		return completed;
	}, [hasGitHubConnection, hasVercelConnection]);

	const steps = useMemo(
		() => [
			{
				title: "Connect GitHub",
				short_description: "Link your GitHub account to manage your codebase",
				full_description: (
					<div className="space-y-4">
						{hasGitHubConnection && (
							<div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
								<CheckIcon className="h-4 w-4" />
								<span>GitHub account connected</span>
							</div>
						)}
						<div className="mx-auto">
							<GitHubConnectButton className="mt-2" />
						</div>
					</div>
				),
			},
			{
				title: "Connect Vercel",
				short_description: "Link your Vercel account for deployment",
				full_description: (
					<div className="space-y-4">
						{hasVercelConnection && (
							<div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
								<CheckIcon className="h-4 w-4" />
								<span>Vercel account connected</span>
							</div>
						)}
						{user && <VercelConnectButton className="mt-2" user={user} isConnected={hasVercelConnection} />}
					</div>
				),
			},
			{
				title: "Deploy Your Project",
				short_description: "Launch your site with one-click deployment",
				full_description: (
					<div className="space-y-4">
						<div className="mx-auto">
							<DashboardVercelDeploy className="mt-2" isVercelConnected={true} user={user ?? undefined} />
						</div>
						<div className="rounded-lg bg-primary/10 p-3 text-center">
							<h3 className="font-semibold">Almost there!</h3>
							<p className="text-sm text-muted-foreground mt-1">
								Once deployed, your site will be available at your custom domain or a
								Vercel-provided URL.
							</p>
						</div>
					</div>
				),
			},
		],
		[hasGitHubConnection, hasVercelConnection, user]
	);

	const handleComplete = () => {
		setOnboardingState((prev) => ({ ...(prev ?? defaultOnboardingState), completed: true }));
		toast({
			title: "Onboarding completed!",
			description: `You're all set to start building with ${siteConfig.title}.`,
		});
		onComplete?.();
	};

	const handleSkip = () => {
		setOnboardingState((prev) => ({ ...(prev ?? defaultOnboardingState), completed: true }));
		onComplete?.();
	};

	if (!user || safeOnboardingState.completed) return null;

	return (
		<IntroDisclosure
			steps={steps}
			open={open}
			setOpen={setOpen}
			featureId={`onboarding-${user.id}`}
			onComplete={handleComplete}
			onSkip={handleSkip}
			initialStep={safeOnboardingState.currentStep}
			initialCompletedSteps={initialCompletedSteps}
			onStepChange={(index) =>
				setOnboardingState((prev) => {
					const safePrev = prev ?? defaultOnboardingState;
					return {
						...safePrev,
						currentStep: index,
						steps: {
							...safePrev.steps,
							[stepIds[Math.max(0, Math.min(stepIds.length - 1, index))] || ""]: true,
						},
					};
				})
			}
		/>
	);
};
