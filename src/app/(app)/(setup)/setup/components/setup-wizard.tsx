"use client";

import { VercelDeployButton } from "@/components/buttons/vercel-deploy-button";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { GitHubConnectButton } from "@/components/ui/github-connect-button";
import { Progress } from "@/components/ui/progress";
import { VercelConnectButton } from "@/components/ui/vercel-connect-button";
import { siteConfig } from "@/config/site";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Circle } from "lucide-react";
import { useEffect, useState } from "react";
interface User {
	id: string;
	name: string | null;
	email: string | null;
	image: string | null;
	bio: string | null;
	githubUsername: string | null;
	theme?: "system" | "light" | "dark";
	emailNotifications?: boolean;
	emailVerified: Date | null;
}

interface SetupWizardProps {
	user: User;
	repoDetails: {
		owner: string;
		name: string;
		url: string;
	};
	githubDetails: {
		user: any;
		isConnected: boolean;
		username?: string;
	} | null;
	vercelDetails: {
		isConnected: boolean;
		teamId?: string | null;
		projectId?: string | null;
	} | null;
	createRepository: (formData: FormData) => Promise<{ url: string }>;
	deploy: (formData: FormData) => Promise<{ deploymentId: string }>;
	getDeploymentStatus: (deploymentId: string) => Promise<{ status: string; url?: string }>;
	getVercelDeployUrl: (formData: FormData) => Promise<{ deployUrl: string }>;
}

interface DeploymentStatus {
	status: 'idle' | 'building' | 'deploying' | 'ready' | 'error';
	url?: string;
	error?: string;
}

const initialSteps = [
	{
		id: "github",
		title: "Connect GitHub",
		description: "Connect your GitHub account to get started",
		isComplete: false,
	},
	{
		id: "deployment-method",
		title: "Choose Deployment Method",
		description: "Select how you want to deploy your project",
		isComplete: false,
	},
	{
		id: "repository",
		title: "Create Repository",
		description: "Create a copy in your GitHub account",
		isComplete: false,
	},
	{
		id: "vercel",
		title: "Connect Vercel",
		description: "Connect your Vercel account",
		isComplete: false,
	},
	{
		id: "deploy",
		title: "Deploy Project",
		description: "Deploy your application",
		isComplete: false,
	},
	{
		id: "config",
		title: "Configuration",
		description: "Configure your application settings",
		isComplete: false,
	},
];

export const SetupWizard = ({ user, repoDetails, githubDetails, vercelDetails, createRepository, deploy, getDeploymentStatus, getVercelDeployUrl }: SetupWizardProps) => {
	const [currentStep, setCurrentStep] = useState(1);
	const [steps, setSteps] = useState(initialSteps);
	const { toast } = useToast();
	const [repoUrl, setRepoUrl] = useState<string>();
	const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({ status: 'idle' });
	const [deploymentProgress, setDeploymentProgress] = useState(0);
	const [deploymentMethod, setDeploymentMethod] = useState<'vercel-button' | 'github-clone'>();

	const isGitHubConnected = githubDetails?.isConnected ?? false;
	const isVercelConnected = vercelDetails?.isConnected ?? false;
	const showAllSteps = true;
	// Auto-advance when GitHub is connected
	useEffect(() => {
		if (currentStep === 0 && isGitHubConnected) {
			markStepComplete("github");
		}
	}, [isGitHubConnected, currentStep]);

	// Auto-advance when Vercel is connected
	useEffect(() => {
		if (currentStep === 2 && isVercelConnected) {
			markStepComplete("vercel");
		}
	}, [isVercelConnected, currentStep]);

	const markStepComplete = (stepId: string) => {
		setSteps((prev) =>
			prev.map((step) =>
				step.id === stepId ? { ...step, isComplete: true } : step
			)
		);
		setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
	};

	const handleCreateRepository = async () => {
		try {
			const formData = new FormData();
			formData.append("owner", repoDetails.owner);
			formData.append("name", repoDetails.name);

			const data = await createRepository(formData);
			setRepoUrl(data.url);
			markStepComplete("repository");
			toast({
				title: "Success",
				description: "Repository created successfully!",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : "Failed to create repository",
				variant: "destructive",
			});
		}
	};

	const handleDeploy = async () => {
		if (!repoUrl || !vercelDetails?.teamId) {
			toast({
				title: "Error",
				description: "Missing required information for deployment",
				variant: "destructive",
			});
			return;
		}

		try {
			setDeploymentStatus({ status: 'building' });
			setDeploymentProgress(25);

			// Start deployment
			const formData = new FormData();
			formData.append("repoUrl", repoUrl);
			formData.append("teamId", vercelDetails.teamId);
			formData.append("projectName", repoDetails.name);

			const { deploymentId } = await deploy(formData);
			setDeploymentProgress(50);
			setDeploymentStatus({ status: 'deploying' });

			// Poll deployment status
			const pollDeployment = async () => {
				const { status, url } = await getDeploymentStatus(deploymentId);

				if (status === 'error') {
					setDeploymentStatus({ status: 'error', error: 'Deployment failed' });
					return;
				}

				if (status === 'ready') {
					setDeploymentStatus({ status: 'ready', url });
					setDeploymentProgress(100);
					markStepComplete("deploy");
					return;
				}

				// Continue polling
				setDeploymentProgress((prev) => Math.min(prev + 10, 90));
				setTimeout(pollDeployment, 5000);
			};

			await pollDeployment();
		} catch (error) {
			setDeploymentStatus({
				status: 'error',
				error: error instanceof Error ? error.message : 'Deployment failed'
			});
			toast({
				title: "Error",
				description: "Failed to deploy project",
				variant: "destructive",
			});
		}
	};

	const handleDeploymentMethodSelect = (method: 'vercel-button' | 'github-clone') => {
		setDeploymentMethod(method);
		markStepComplete("deployment-method");
	};

	const handleVercelDeploy = async () => {
		try {
			const formData = new FormData();
			formData.append("repository", repoUrl || "");
			formData.append("teamId", vercelDetails?.teamId || "");
			formData.append("project", repoDetails.name);

			const { deployUrl } = await getVercelDeployUrl(formData);

			// Open Vercel deploy in a new window
			const deployWindow = window.open(deployUrl, "_blank");

			// Start checking if the window is closed
			if (deployWindow) {
				const checkWindow = setInterval(() => {
					if (deployWindow.closed) {
						clearInterval(checkWindow);
						// Mark as complete when the window is closed
						markStepComplete("deploy");
						toast({
							title: "Success",
							description: "Deployment initiated successfully! Check your Vercel dashboard for status.",
						});
					}
				}, 1000);

				// Clear interval after 10 minutes to prevent memory leaks
				setTimeout(() => clearInterval(checkWindow), 600000);
			}
		} catch (error) {
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : "Failed to generate deploy URL",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="container mx-auto max-w-4xl p-4">
			<Card>
				<CardHeader>
					<CardTitle>{siteConfig.name} Setup</CardTitle>
					<CardDescription>
						Get started with your own instance of {siteConfig.name}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{/* Progress Steps */}
					<div className="mb-8">
						<div className="flex justify-between">
							{steps.map((step, index) => (
								<div
									key={step.id}
									className={cn(
										"flex flex-col items-center space-y-2",
										index <= currentStep ? "text-primary" : "text-muted-foreground"
									)}
								>
									<div className="relative">
										{step.isComplete ? (
											<CheckCircle className="h-6 w-6" />
										) : index === currentStep ? (
											<Circle className="h-6 w-6" />
										) : (
											<AlertCircle className="h-6 w-6" />
										)}
									</div>
									<div className="text-center">
										<p className="text-sm font-medium">{step.title}</p>
										<p className="text-xs">{step.description}</p>
									</div>
								</div>
							))}
						</div>
						<Progress value={deploymentProgress} className="mt-4" />
					</div>

					{/* Step Content */}
					<div className="space-y-4">
						{/* GitHub Connection Step */}
						{(showAllSteps || currentStep === 0) && (
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Connect your GitHub Account</h3>
								<p className="text-sm text-muted-foreground">
									We need access to your GitHub account to create and manage your repository.
								</p>
								<GitHubConnectButton />
							</div>
						)}

						{/* Deployment Method Selection Step */}
						{(showAllSteps || currentStep === 1) && (
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Choose Deployment Method</h3>
								<p className="text-sm text-muted-foreground">
									Select how you would like to deploy your project
								</p>
								<div className="grid grid-cols-2 gap-4">
									<Button
										variant={deploymentMethod === 'vercel-button' ? 'default' : 'outline'}
										onClick={() => handleDeploymentMethodSelect('vercel-button')}
										className="h-auto p-4"
									>
										<div className="space-y-2 text-left">
											<h4 className="font-medium">Vercel Deploy Button</h4>
											<p className="text-sm text-muted-foreground">
												Quick one-click deployment using Vercel's deploy button
											</p>
										</div>
									</Button>
									<Button
										variant={deploymentMethod === 'github-clone' ? 'default' : 'outline'}
										onClick={() => handleDeploymentMethodSelect('github-clone')}
										className="h-auto p-4"
									>
										<div className="space-y-2 text-left">
											<h4 className="font-medium">GitHub Clone & Deploy</h4>
											<p className="text-sm text-muted-foreground">
												Clone to your GitHub account first, then deploy to Vercel
											</p>
										</div>
									</Button>
								</div>
							</div>
						)}

						{/* Repository Creation Step */}
						{(showAllSteps || currentStep === 2) && (
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Create Repository</h3>
								<p className="text-sm text-muted-foreground">
									Create a copy of the template in your GitHub account
								</p>
								<Button
									onClick={handleCreateRepository}
									disabled={!isGitHubConnected}
								>
									Create Repository
								</Button>
							</div>
						)}

						{/* Vercel Connection Step */}
						{(showAllSteps || currentStep === 3) && (
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Connect to Vercel</h3>
								<p className="text-sm text-muted-foreground">
									Connect your Vercel account to deploy your project
								</p>
								<VercelConnectButton />
								<VercelDeployButton />
							</div>
						)}

						{/* Deployment Step */}
						{(showAllSteps || currentStep === 4) && (
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Deploy Your Project</h3>
								<p className="text-sm text-muted-foreground">
									{deploymentMethod === 'vercel-button'
										? "Click the button below to deploy your project on Vercel"
										: "Deploy your project to Vercel"}
								</p>
								{deploymentMethod === 'vercel-button' ? (
									<Button
										onClick={handleVercelDeploy}
										disabled={!repoUrl || !vercelDetails?.teamId}
									>
										Deploy to Vercel
									</Button>
								) : (
									<Button
										onClick={handleDeploy}
										disabled={!isVercelConnected || !repoUrl}
									>
										Deploy Project
									</Button>
								)}
								{deploymentStatus.status === 'error' && (
									<p className="text-sm text-destructive">
										{deploymentStatus.error || "An error occurred during deployment"}
									</p>
								)}
								{deploymentStatus.status === 'ready' && (
									<p className="text-sm text-green-600">
										Deployment successful! Visit your site at{" "}
										<a
											href={deploymentStatus.url}
											target="_blank"
											rel="noopener noreferrer"
											className="underline"
										>
											{deploymentStatus.url}
										</a>
									</p>
								)}
							</div>
						)}

						{/* Configuration Step */}
						{(showAllSteps || currentStep === 5) && (
							<div className="space-y-4">
								<h3 className="text-lg font-medium">Configure Your Application</h3>
								<p className="text-sm text-muted-foreground">
									Set up your application's configuration
								</p>
								{/* Add configuration form here */}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
