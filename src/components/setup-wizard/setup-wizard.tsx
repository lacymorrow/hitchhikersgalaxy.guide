"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { GitHubConnectButton } from "@/components/ui/github-connect-button";
import { Progress } from "@/components/ui/progress";
import { VercelConnectButton } from "@/components/ui/vercel-connect-button";
import { siteConfig } from "@/config/site";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Circle } from "lucide-react";
import { useState } from "react";

interface SetupWizardProps {
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
        teamId?: string;
        projectId?: string;
    } | null;
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

export const SetupWizard = ({ repoDetails, githubDetails, vercelDetails }: SetupWizardProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState(initialSteps);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [repoUrl, setRepoUrl] = useState<string>();
    const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({ status: 'idle' });
    const [deploymentProgress, setDeploymentProgress] = useState(0);

    const isGitHubConnected = githubDetails?.isConnected ?? false;
    const isVercelConnected = vercelDetails?.isConnected ?? false;

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
            setIsLoading(true);
            const response = await fetch("/api/setup/create-repository", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    template: {
                        owner: repoDetails.owner,
                        name: repoDetails.name,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data = await response.json();
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
        } finally {
            setIsLoading(false);
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
            setIsLoading(true);
            setDeploymentStatus({ status: 'building' });
            setDeploymentProgress(25);

            // Start deployment
            const deployResponse = await fetch("/api/setup/deploy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    repoUrl,
                    teamId: vercelDetails.teamId,
                    projectName: repoDetails.name,
                }),
            });

            if (!deployResponse.ok) {
                throw new Error(await deployResponse.text());
            }

            const { deploymentId } = await deployResponse.json();
            setDeploymentProgress(50);
            setDeploymentStatus({ status: 'deploying' });

            // Poll deployment status
            const pollDeployment = async () => {
                const statusResponse = await fetch(`/api/setup/deployment-status?id=${deploymentId}`);
                if (!statusResponse.ok) {
                    throw new Error(await statusResponse.text());
                }

                const { status, url } = await statusResponse.json();

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
        } finally {
            setIsLoading(false);
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
                                            <CheckCircle className="h-8 w-8" />
                                        ) : (
                                            <Circle className="h-8 w-8" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{step.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="space-y-4">
                        {currentStep === 0 && (
                            <div className="space-y-4">
                                <div className="rounded-lg border bg-muted p-4">
                                    <h3 className="mb-2 font-semibold">Connect Your GitHub Account</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        We'll use your GitHub account to create a copy of {siteConfig.name} in your account.
                                    </p>
                                    <GitHubConnectButton />
                                    {isGitHubConnected && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Connected as {githubDetails?.username}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div className="rounded-lg border bg-muted p-4">
                                    <h3 className="mb-2 font-semibold">Create Your Repository</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        We'll create a copy of {siteConfig.name} in your GitHub account.
                                    </p>
                                    <Button
                                        onClick={handleCreateRepository}
                                        disabled={!isGitHubConnected || isLoading}
                                    >
                                        {isLoading ? "Creating..." : "Create Repository"}
                                    </Button>
                                    {!isGitHubConnected && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Please connect your GitHub account first
                                        </p>
                                    )}
                                    {repoUrl && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Repository created at:{" "}
                                            <a
                                                href={repoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                {repoUrl}
                                            </a>
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="rounded-lg border bg-muted p-4">
                                    <h3 className="mb-2 font-semibold">Connect Vercel Account</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Connect your Vercel account to deploy your application.
                                    </p>
                                    <VercelConnectButton />
                                    {isVercelConnected && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Vercel account connected successfully
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <div className="rounded-lg border bg-muted p-4">
                                    <h3 className="mb-2 font-semibold">Deploy Your Application</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Deploy your application to Vercel.
                                    </p>
                                    <div className="space-y-4">
                                        <Button
                                            onClick={handleDeploy}
                                            disabled={!isVercelConnected || !repoUrl || isLoading}
                                        >
                                            {isLoading ? "Deploying..." : "Start Deployment"}
                                        </Button>

                                        {deploymentStatus.status !== 'idle' && (
                                            <div className="space-y-2">
                                                <Progress value={deploymentProgress} />
                                                <div className="flex items-center space-x-2">
                                                    {deploymentStatus.status === 'error' ? (
                                                        <>
                                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                                            <span className="text-sm text-destructive">
                                                                {deploymentStatus.error}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">
                                                            {deploymentStatus.status === 'building' && 'Building your application...'}
                                                            {deploymentStatus.status === 'deploying' && 'Deploying to Vercel...'}
                                                            {deploymentStatus.status === 'ready' && (
                                                                <>
                                                                    Deployment complete! View your site at{" "}
                                                                    <a
                                                                        href={deploymentStatus.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary hover:underline"
                                                                    >
                                                                        {deploymentStatus.url}
                                                                    </a>
                                                                </>
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <div className="rounded-lg border bg-muted p-4">
                                    <h3 className="mb-2 font-semibold">Configure Your Application</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Set up your application's environment variables and initial configuration.
                                    </p>
                                    {/* Configuration form will be added here */}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
