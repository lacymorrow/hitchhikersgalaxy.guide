"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import { initiateDeployment } from "@/server/actions/deployment-actions";
import { VercelConnectButton } from "@/components/buttons/vercel-connect-button";
import { User } from "@/types/user";


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
        <VercelConnectButton className="w-full mt-3" user={user} />
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