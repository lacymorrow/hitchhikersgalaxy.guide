"use client";

import { IconBrandVercelFilled } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, GithubIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { GitHubConnectDialog } from "@/components/buttons/github-connect-dialog";
import { VercelConnectButton } from "@/components/shipkit/vercel-connect-button";
import { VercelDeployButton } from "@/components/shipkit/vercel-deploy-button";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { siteConfig } from "@/config/site-config";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/types/user";

// Define the onboarding steps
const STEPS = [
	{
		id: "github",
		title: "Connect GitHub",
		description: "Link your GitHub account to manage your codebase",
	},
	{
		id: "vercel",
		title: "Connect Vercel",
		description: "Link your Vercel account for deployment",
	},
	{
		id: "deploy",
		title: "Deploy Your Project",
		description: "Launch your site with one-click deployment",
	},
];

// Installation code snippet
const installationCode = `# Clone the repository
git clone ${siteConfig.repo.url}

# Change directory
cd shipkit

# Install dependencies
pnpm install

# Start the development server
pnpm dev`;

// Deployment code snippet
const deploymentCode = `# Build your project
pnpm build

# Deploy to Vercel
vercel deploy`;

interface OnboardingWizardProps {
	user: User | null;
	hasGitHubConnection?: boolean;
	hasVercelConnection?: boolean;
	onComplete?: () => void;
}

export function OnboardingWizard({
	user,
	hasGitHubConnection = false,
	hasVercelConnection = false,
	onComplete,
}: OnboardingWizardProps) {
	// Check if there has been a Vercel connection attempt
	const hasVercelConnectionAttempt = !!user?.vercelConnectionAttemptedAt || hasVercelConnection;

	const initialStep = hasGitHubConnection ? (hasVercelConnectionAttempt ? 2 : 1) : 0;
	// Check if onboarding has been completed
	const [onboardingState, setOnboardingState] = useLocalStorage<{
		completed: boolean;
		currentStep: number;
		steps: Record<string, boolean>;
	}>(`onboarding-${user?.id}`, {
		completed: false,
		currentStep: initialStep,
		steps: {
			github: hasGitHubConnection,
			vercel: hasVercelConnectionAttempt,
			deploy: false,
		},
	});

	// Initialize currentStep from onboardingState only once
	const [currentStep, setCurrentStep] = useState(onboardingState.currentStep);
	const { toast } = useToast();

	// Update the steps when connection status changes
	useEffect(() => {
		setOnboardingState((prev) => {
			// Only update if the values are different to prevent infinite loop
			if (
				prev.steps.github === hasGitHubConnection &&
				prev.steps.vercel === hasVercelConnectionAttempt
			) {
				return prev;
			}

			return {
				...prev,
				steps: {
					...prev.steps,
					github: hasGitHubConnection,
					vercel: hasVercelConnectionAttempt,
				},
			};
		});
	}, [hasGitHubConnection, hasVercelConnectionAttempt, setOnboardingState]);

	if (!user) {
		return null;
	}

	// Update onboardingState when step changes, but avoid the useEffect for this
	const updateStep = (newStep: number) => {
		setCurrentStep(newStep);
		setOnboardingState((prev) => ({
			...prev,
			currentStep: newStep,
		}));
	};

	// Mark a step as completed
	const completeStep = (stepId: string) => {
		setOnboardingState((prev) => ({
			...prev,
			steps: {
				...prev.steps,
				[stepId]: true,
			},
		}));
	};

	// Navigate to the next step
	const nextStep = () => {
		if (currentStep < STEPS.length - 1) {
			completeStep(STEPS[currentStep].id);
			updateStep(currentStep + 1);
		} else {
			completeOnboarding();
		}
	};

	// Navigate to the previous step
	const prevStep = () => {
		if (currentStep > 0) {
			updateStep(currentStep - 1);
		}
	};

	// Complete the onboarding process
	const completeOnboarding = () => {
		completeStep(STEPS[currentStep].id);
		setOnboardingState((prev) => ({
			...prev,
			completed: true,
		}));

		toast({
			title: "Onboarding completed!",
			description: "You're all set to start building with Shipkit.",
		});

		if (onComplete) {
			onComplete();
		}
	};

	// Skip onboarding
	const skipOnboarding = () => {
		setOnboardingState((prev) => ({
			...prev,
			completed: true,
		}));

		if (onComplete) {
			onComplete();
		}
	};

	// Calculate progress percentage
	const progress = Math.round(
		(Object.values(onboardingState.steps).filter(Boolean).length / STEPS.length) * 100
	);

	// If onboarding is already completed, don't show the wizard
	if (onboardingState.completed) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
			<Card className="w-full max-w-3xl shadow-lg min-h-[500px]">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-2xl">{STEPS[currentStep].title}</CardTitle>
							<CardDescription>{STEPS[currentStep].description}</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">
								Step {currentStep + 1} of {STEPS.length}
							</span>
							<Button variant="ghost" size="sm" onClick={skipOnboarding}>
								Skip
							</Button>
						</div>
					</div>
					<Progress value={progress} className="h-2" />
				</CardHeader>

				<CardContent>
					<AnimatePresence mode="wait">
						<motion.div
							key={currentStep}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.2 }}
							className="min-h-[300px]"
						>
							{/* GitHub Connection Step */}
							{currentStep === 0 && (
								<div className="space-y-6">
									<div className="rounded-lg border p-6">
										<div className="flex items-start gap-4">
											<div className="rounded-full bg-muted p-2">
												<GithubIcon className="h-6 w-6" />
											</div>
											<div>
												<h3 className="font-semibold">Connect your GitHub account</h3>
												<p className="text-sm text-muted-foreground mt-1">
													Connecting GitHub allows you to easily manage your codebase, track
													changes, and deploy your site directly from your repository.
												</p>

												{hasGitHubConnection && (
													<div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
														<CheckIcon className="h-4 w-4" />
														<span>GitHub account connected</span>
													</div>
												)}

												<div className="mx-auto">
													<GitHubConnectDialog className="mt-4" />
												</div>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Vercel Connection Step */}
							{currentStep === 1 && (
								<div className="space-y-6">
									<div className="rounded-lg border p-6 flex flex-col gap-4">
										<div className="flex items-start gap-4">
											<div className="rounded-full bg-muted p-2">
												<IconBrandVercelFilled className="h-6 w-6" />
											</div>
											<div>
												<h3 className="font-semibold">Connect your Vercel account</h3>
												<p className="text-sm text-muted-foreground mt-1">
													Link your Vercel account to enable one-click deployments, preview
													environments, and continuous integration.
												</p>

												{hasVercelConnection && (
													<div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
														<CheckIcon className="h-4 w-4" />
														<span>Vercel account connected</span>
													</div>
												)}

												{user.vercelConnectionAttemptedAt && !hasVercelConnection && (
													<div className="mt-4 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500">
														<CheckIcon className="h-4 w-4" />
														<span>Connection attempted - you can proceed to the next step</span>
													</div>
												)}
											</div>
										</div>
										<VercelConnectButton className="mt-4 w-full" user={user} />
									</div>

									<div className="rounded-lg bg-muted p-4">
										<h4 className="font-medium mb-2">Benefits of Vercel</h4>
										<ul className="space-y-2 text-sm">
											<li className="flex items-center gap-2">
												<CheckIcon className="h-4 w-4 text-green-600 dark:text-green-500" />
												<span>Automatic deployments from Git</span>
											</li>
											<li className="flex items-center gap-2">
												<CheckIcon className="h-4 w-4 text-green-600 dark:text-green-500" />
												<span>Preview deployments for pull requests</span>
											</li>
											<li className="flex items-center gap-2">
												<CheckIcon className="h-4 w-4 text-green-600 dark:text-green-500" />
												<span>Custom domains and SSL certificates</span>
											</li>
										</ul>
									</div>
								</div>
							)}

							{/* Deploy Step */}
							{currentStep === 2 && (
								<div className="space-y-6">
									<div className="rounded-lg border p-6 flex flex-col gap-4">
										<div className="flex items-start gap-4">
											<div className="rounded-full bg-muted p-2">
												<IconBrandVercelFilled className="h-6 w-6" />
											</div>
											<div>
												<h3 className="font-semibold">Deploy your project</h3>
												<p className="text-sm text-muted-foreground mt-1">
													Deploy your Next.js application to Vercel with just a few clicks. Your
													project will be live and accessible to everyone instantly.
												</p>
											</div>
										</div>
										<div className="mx-auto">
											<VercelDeployButton />
										</div>
									</div>

									<div className="rounded-lg bg-primary/10 p-4 text-center">
										<h3 className="font-semibold">Almost there!</h3>
										<p className="text-sm text-muted-foreground mt-1">
											Once deployed, your site will be available at your custom domain or a
											Vercel-provided URL. Click "Finish" below to complete the onboarding process.
										</p>
									</div>
								</div>
							)}
						</motion.div>
					</AnimatePresence>
				</CardContent>

				<CardFooter className="flex justify-between border-t p-6">
					<Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
						Previous
					</Button>

					<Button onClick={currentStep === STEPS.length - 1 ? completeOnboarding : nextStep}>
						{currentStep === STEPS.length - 1 ? "Finish" : "Next"}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
