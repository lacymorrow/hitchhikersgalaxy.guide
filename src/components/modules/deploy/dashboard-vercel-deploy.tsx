"use client";

import { AlertCircle, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Link as LinkWithTransition } from "@/components/primitives/link-with-transition";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { ConfettiSideCannons } from "@/components/ui/magicui/confetti/confetti-side-cannons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { env } from "@/env";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";
import { initiateDeployment } from "@/server/actions/deployment-actions";

interface DeploymentStatus {
    step: "idle" | "deploying" | "completed" | "error";
    message?: string;
    githubRepo?: {
        url: string;
        name: string;
    };
    vercelProject?: {
        projectUrl: string;
        deploymentUrl?: string;
    };
    error?: string;
}

const SHIPKIT_REPO = env.NEXT_PUBLIC_SHIPKIT_REPO;

interface DashboardVercelDeployProps {
    className?: string;
    isVercelConnected?: boolean;
}

export const DashboardVercelDeploy = ({
    className,
    isVercelConnected = true,
}: DashboardVercelDeployProps) => {
    const [open, setOpen] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [isDeploying, setIsDeploying] = useState(false);

    const handleDeploy = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!projectName) {
            toast.error("Please enter a project name");
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
            } else {
                toast.error(result.error || "Deployment failed to start");
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
        setOpen(false);
    };

    const triggerButton = (
        <Button
            size="lg"
            disabled={!isVercelConnected}
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
                            <LinkWithTransition
                                href="/settings/accounts"
                                className="text-xs text-primary hover:underline"
                            >
                                Go to Settings →
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
                        <Input
                            id="projectName"
                            placeholder={`my-${siteConfig.branding.projectSlug}-app`}
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            disabled={isDeploying}
                        />
                        <p className="text-xs text-muted-foreground">
                            Lowercase letters, numbers, and hyphens only
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={isDeploying || !projectName} className="flex-1">
                            {isDeploying ? "Deploying..." : "Deploy Now"}
                        </Button>
                        <Button type="button" onClick={resetForm} variant="outline" disabled={isDeploying}>
                            Cancel
                        </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        Ensure you've connected GitHub and Vercel in{" "}
                        <LinkWithTransition
                            href="/settings/accounts"
                            className="text-primary hover:underline"
                            onClick={() => setOpen(false)}
                        >
                            Settings
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


