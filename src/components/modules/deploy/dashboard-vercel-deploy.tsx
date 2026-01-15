"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { VercelConnectButton } from "@/components/buttons/vercel-connect-button";
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
import { initiateDeployment } from "@/server/actions/deployment-actions";
import type { User } from "@/types/user";

// Constants for validation and timing
const VALIDATION_DEBOUNCE_MS = 300; // 300ms debounce for validation
const VALIDATION_TIMEOUT_MS = 2000; // 2 seconds max wait for validation
const VALIDATION_CHECK_INTERVAL_MS = 100; // Check validation status every 100ms

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
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
		debounceTimerRef.current = setTimeout(() => {
			if (value.trim()) {
				const validation = validateProjectName(value);
				if (!validation.isValid) {
					setValidationError(validation.error ?? "Invalid project name");
				} else {
					setValidationError(null);
				}
			} else {
				setValidationError(null);
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
			toast.info("Please wait for validation to complete.");
			return;
		}

		// Validate project name before submission
		const validation = validateProjectName(projectName);
		if (!validation.isValid) {
			setValidationError(validation.error ?? "Invalid project name");
			toast.error(validation.error ?? "Please enter a valid project name");
			return;
		}

		setIsDeploying(true);
		toast.info("Initiating deployment...");

		const formData = new FormData();
		formData.append("projectName", projectName);

		try {
			const result = await initiateDeployment(formData);

			if (result.success) {
				toast.success(result.message);
				resetForm();
				// Refresh the page to show the new deployment
				router.refresh();
			} else {
				toast.error(result.error ?? "Deployment failed to start");
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
			toast.error(errorMessage);
		} finally {
			setIsDeploying(false);
		}
	};

	const resetForm = () => {
		setProjectName("");
		setValidationError(null);
		setIsValidating(false);
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
							<p className="text-xs text-muted-foreground">Validating project name...</p>
						) : projectName && !validationError ? (
							<p className="text-xs text-green-600">✓ Valid project name</p>
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
							{isDeploying ? "Deploying..." : "Deploy Now"}
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
