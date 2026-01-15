"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { VercelConnectButton } from "@/components/buttons/vercel-connect-button";
import AILoadingState, { type TaskSequence } from "@/components/kokonutui/ai-loading";
import { Link as LinkWithTransition } from "@/components/primitives/link";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site-config";
import { validateProjectName } from "@/lib/schemas/deployment";
import { cn } from "@/lib/utils";
import { checkPendingGitHubInvitation, checkRepositoryNameAvailable, initiateDeployment } from "@/server/actions/deployment-actions";
import type { User } from "@/types/user";

// Constants for validation and timing
const VALIDATION_DEBOUNCE_MS = 300; // 300ms debounce for validation
const VALIDATION_TIMEOUT_MS = 2000; // 2 seconds max wait for validation
const VALIDATION_CHECK_INTERVAL_MS = 100; // Check validation status every 100ms

const DEPLOYMENT_TASK_SEQUENCES: TaskSequence[] = [
	{
		status: "Preparing deployment",
		lines: [
			"Validating project configuration...",
			"Checking GitHub connection...",
			"Verifying Vercel credentials...",
			"Preparing repository template...",
		],
	},
	{
		status: "Creating repository",
		lines: [
			"Forking template repository...",
			"Setting up repository permissions...",
			"Configuring branch protection...",
			"Initializing project structure...",
		],
	},
	{
		status: "Deploying to Vercel",
		lines: [
			"Creating Vercel project...",
			"Configuring environment variables...",
			"Setting up build pipeline...",
			"Initiating first deployment...",
			"Finalizing deployment...",
		],
	},
];

interface DashboardVercelDeployProps {
	className?: string;
	isVercelConnected?: boolean;
	user?: User;
}

export const DashboardVercelDeploy = ({
	className,
	isVercelConnected = true,
	user,
}: DashboardVercelDeployProps) => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [projectName, setProjectName] = useState("");
	const [isDeploying, setIsDeploying] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [isValidating, setIsValidating] = useState(false);
	const [availabilityChecked, setAvailabilityChecked] = useState(false);
	const [availabilityReason, setAvailabilityReason] = useState<string | undefined>(undefined);
	const [pendingInvitation, setPendingInvitation] = useState<{
		hasPending: boolean;
		url?: string;
		isChecking: boolean;
	}>({ hasPending: false, isChecking: false });
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Check for pending GitHub invitation when dialog opens
	useEffect(() => {
		if (open && isVercelConnected) {
			setPendingInvitation((prev) => ({ ...prev, isChecking: true }));
			checkPendingGitHubInvitation()
				.then((result) => {
					setPendingInvitation({
						hasPending: result.hasPendingInvitation,
						url: result.invitationUrl,
						isChecking: false,
					});
				})
				.catch(() => {
					setPendingInvitation({ hasPending: false, isChecking: false });
				});
		}
	}, [open, isVercelConnected]);

	// Cleanup debounce timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

	const validateProjectNameDebounced = useCallback((value: string) => {
		// Clear any existing timer
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		// Show validating state immediately if there's input
		if (value.trim()) {
			setIsValidating(true);
		}

		// Set new debounce timer
		debounceTimerRef.current = setTimeout(async () => {
			if (value.trim()) {
				// First, validate the format
				const validation = validateProjectName(value);
				if (!validation.isValid) {
					setValidationError(validation.error ?? "Invalid project name");
					setAvailabilityChecked(false);
					setIsValidating(false);
					return;
				}

				// Then check if the name is available on GitHub
				try {
					const availability = await checkRepositoryNameAvailable(value.trim());
					setAvailabilityChecked(availability.checked);
					if (!availability.available) {
						setValidationError(availability.error ?? "Repository name not available");
					} else {
						setValidationError(null);
					}
				} catch {
					// If check fails, clear error and let deployment handle it
					setAvailabilityChecked(false);
					setValidationError(null);
				}
			} else {
				setValidationError(null);
				setAvailabilityChecked(false);
			}
			setIsValidating(false);
		}, VALIDATION_DEBOUNCE_MS);
	}, []);

	const handleProjectNameChange = (value: string) => {
		setProjectName(value);

		// Clear validation error immediately when user starts typing
		if (validationError && !isValidating) {
			setValidationError(null);
		}

		// Trigger debounced validation
		validateProjectNameDebounced(value);
	};

	const handleDeploy = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		handleDeployAsync();
	};

	const handleDeployAsync = async () => {
		// Don't submit if validation is in progress - disable submit button instead
		if (isValidating) {
			return;
		}

		// Validate project name before submission
		const validation = validateProjectName(projectName);
		if (!validation.isValid) {
			setValidationError(validation.error ?? "Invalid project name");
			return;
		}

		setIsDeploying(true);

		const formData = new FormData();
		formData.append("projectName", projectName);

		try {
			const result = await initiateDeployment(formData);

			if (result.success) {
				resetForm();
				// Redirect to deployments page to monitor progress and see any errors
				router.push("/deployments");
			} else {
				setValidationError(result.error ?? "Deployment failed to start");
				setIsDeploying(false);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
			setValidationError(errorMessage);
			setIsDeploying(false);
		}
	};

	const resetForm = () => {
		setProjectName("");
		setValidationError(null);
		setIsValidating(false);
		setAvailabilityChecked(false);
		setOpen(false);
		// Clear any pending validation
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}
	};

	const triggerButton = isVercelConnected ? (
		<Button
			size="lg"
			// disabled={!isVercelConnected}
			className={cn(
				"group relative overflow-hidden transition-all duration-300 ease-out",
				isVercelConnected && "hover:bg-primary-foreground hover:text-primary",
				className
			)}
		>
			<span className="relative z-10 flex items-center justify-center gap-2">
				<VercelIcon className="h-5 w-5" />
				Deploy to Vercel
			</span>
		</Button>
	) : (
		<VercelConnectButton user={user} isConnected={isVercelConnected} />
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{isVercelConnected ? (
				<DialogTrigger asChild>{triggerButton}</DialogTrigger>
			) : (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
						<TooltipContent className="flex flex-col gap-2">
							<p>Connect your Vercel account to deploy</p>
							<LinkWithTransition href="/settings/accounts">
								<span className="text-xs text-primary hover:underline">Go to Settings →</span>
							</LinkWithTransition>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
			<DialogContent className="sm:max-w-md">
				{isDeploying ? (
					<div className="py-8">
						<AILoadingState
							taskSequences={DEPLOYMENT_TASK_SEQUENCES}
							className="flex items-center justify-center w-full"
						/>
					</div>
				) : pendingInvitation.isChecking ? (
					<div className="py-8 flex items-center justify-center">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : pendingInvitation.hasPending ? (
					<div className="py-6 space-y-6">
						{/* Avatar section */}
						<div className="flex items-center justify-center gap-2">
							<img
								src={`https://github.com/${siteConfig.repo.owner}.png?size=80`}
								alt={siteConfig.repo.owner}
								className="h-12 w-12 rounded-full border bg-muted"
							/>
							<span className="text-muted-foreground text-lg">+</span>
							<div className="h-12 w-12 rounded-full border bg-muted flex items-center justify-center">
								<GitHubIcon className="h-6 w-6" />
							</div>
						</div>

						{/* Invitation text */}
						<div className="text-center space-y-1">
							<p className="text-lg">
								<a
									href={`https://github.com/${siteConfig.repo.owner}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline font-medium"
								>
									{siteConfig.repo.owner}
								</a>{" "}
								<span className="text-foreground">invited you to collaborate on</span>
							</p>
							<p className="text-lg font-semibold">
								{siteConfig.repo.owner}/{siteConfig.repo.name}
							</p>
						</div>

						{/* Buttons */}
						<div className="flex items-center justify-center gap-3">
							<Button
								asChild
								className="bg-[#2da44e] hover:bg-[#2c974b] text-white"
							>
								<a
									href={pendingInvitation.url ?? "https://github.com/notifications"}
									target="_blank"
									rel="noopener noreferrer"
								>
									Accept invitation
								</a>
							</Button>
							<Button variant="outline" onClick={() => setOpen(false)}>
								Cancel
							</Button>
						</div>
					</div>
				) : (
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<VercelIcon className="h-5 w-5" />
								Deploy to Vercel
							</DialogTitle>
							<DialogDescription>
								Create your own instance on GitHub and deploy it to Vercel instantly.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleDeploy} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="projectName">Project Name</Label>
								<div className="relative">
									<Input
										id="projectName"
										placeholder={`my-${siteConfig.branding.projectSlug}-app`}
										value={projectName}
										onChange={(e) => handleProjectNameChange(e.target.value)}
										disabled={isDeploying}
										className={cn(validationError ? "border-red-500" : "", isValidating ? "pr-10" : "")}
									/>
									{isValidating && (
										<div className="absolute right-3 top-1/2 -translate-y-1/2">
											<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
										</div>
									)}
								</div>
								{validationError ? (
									<p className="text-xs text-red-500">{validationError}</p>
								) : isValidating ? (
									<p className="text-xs text-muted-foreground">Checking availability...</p>
								) : projectName && !validationError && availabilityChecked ? (
									<p className="text-xs text-green-600">✓ Name available</p>
								) : projectName && !validationError ? (
									<p className="text-xs text-yellow-600">✓ Valid format (couldn&apos;t verify GitHub availability)</p>
								) : (
									<p className="text-xs text-muted-foreground">
										Lowercase letters, numbers, hyphens, underscores, and dots only
									</p>
								)}
							</div>

							<div className="flex gap-2">
								<Button
									type="submit"
									disabled={isDeploying || !projectName || !!validationError || isValidating}
									className="flex-1"
								>
									Deploy Now
								</Button>
								<Button type="button" onClick={resetForm} variant="outline" disabled={isDeploying}>
									Cancel
								</Button>
							</div>

							<p className="text-xs text-center text-muted-foreground">
								Ensure you&apos;ve connected GitHub and Vercel in{" "}
								<LinkWithTransition href="/settings/accounts" onClick={() => setOpen(false)}>
									<span className="text-primary hover:underline">Settings</span>
								</LinkWithTransition>
							</p>
						</form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};

const VercelIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		viewBox="0 0 76 65"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-label="Vercel Logo"
		role="img"
	>
		<path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
	</svg>
);

const GitHubIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		viewBox="0 0 24 24"
		fill="currentColor"
		xmlns="http://www.w3.org/2000/svg"
		aria-label="GitHub Logo"
		role="img"
	>
		<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
	</svg>
);
