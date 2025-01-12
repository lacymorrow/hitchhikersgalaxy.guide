"use client";

import { Icons } from "@/components/images/icons";
import { Link } from "@/components/primitives/link-with-transition";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { disconnectGitHub } from "@/server/actions/github";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

interface GitHubSession {
	user: {
		id: string;
		email: string;
		githubUsername?: string | null;
	};
}

export const GitHubConnectButton = () => {
	const { data: session, update: updateSession } = useSession();
	const [isLoading, setIsLoading] = useState(false);
	const user = (session as GitHubSession)?.user;
	console.info("user", user);
	const githubUsername = user?.githubUsername;
	const isConnected = !!githubUsername;

	const handleConnect = async () => {
		await signIn("github", {
			callbackUrl: "/settings/github-callback",
			scope: "read:user,user:email,repo",
		});
	};

	const handleDisconnect = async () => {
		if (!user?.id) return;

		try {
			setIsLoading(true);
			await disconnectGitHub();
			// Update the session with the new user data
			await updateSession();
			toast.success("GitHub account disconnected successfully");
		} catch (error) {
			console.error(error);
			toast.error("Failed to disconnect GitHub account. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					{isConnected ? (
						<div className="flex flex-col items-center justify-center gap-1">
							<Link
								href={siteConfig.repo.url}
								className={cn(
									buttonVariants({
										variant: "outline",
										size: "lg",
									}),
									"w-full",
								)}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Icons.github className="mr-2 h-4 w-4" />
								View Repository
							</Link>
							<Button
								onClick={() => void handleDisconnect()}
								variant={"link"}
								size={"sm"}
								disabled={isLoading}
								className="text-muted-foreground"
							>
								Not {githubUsername}? Click to disconnect.
							</Button>
						</div>
					) : (
						<Button onClick={() => void handleConnect()} disabled={isLoading}>
							<Icons.github className="mr-2 h-4 w-4" />
							{isLoading ? "Connecting..." : "Connect GitHub"}
						</Button>
					)}
				</TooltipTrigger>
				<TooltipContent>
					<p>
						{isConnected
							? `Remove GitHub repository access for ${githubUsername}`
							: "Grant access to the private repository"}
					</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
