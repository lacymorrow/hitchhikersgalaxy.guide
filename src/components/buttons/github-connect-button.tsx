"use client";

import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/assets/icons";
import { Link } from "@/components/primitives/link-with-transition";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { siteConfig } from "@/config/site-config";
import { STATUS_CODES } from "@/config/status-codes";
import { cn } from "@/lib/utils";
import { disconnectGitHub } from "@/server/actions/github";

interface GitHubSession {
	user: {
		id: string;
		email: string;
		githubUsername?: string | null;
	};
}

export const GitHubConnectButton = ({ className }: { className?: string }) => {
	const pathname = usePathname();
	const { data: session, update: updateSession } = useSession();
	const [isLoading, setIsLoading] = useState(false);
	const user = (session as GitHubSession)?.user;
	const githubUsername = user?.githubUsername;
	const isConnected = !!githubUsername;

	const handleConnect = async () => {
		try {
			setIsLoading(true);
			// Use GitHub OAuth to connect account
			await signIn("github", {
				callbackUrl: `${routes.githubConnect}?${SEARCH_PARAM_KEYS.nextUrl}=${pathname}&${SEARCH_PARAM_KEYS.statusCode}=${STATUS_CODES.CONNECT_GITHUB.code}`,
				redirect: true,
				// The connection status will be determined from the callback URL
				// since custom parameters can't be reliably passed through OAuth flow
			});
			// Note: The OAuth flow will redirect, so we won't reach this point until after the user returns
		} catch (error) {
			console.error("GitHub connect error:", error);
			toast.error(error instanceof Error ? error.message : "Failed to connect GitHub account");
			setIsLoading(false);
		}
	};

	const handleDisconnect = async () => {
		if (!user?.id) return;

		try {
			setIsLoading(true);
			await disconnectGitHub();
			// Force a full session update to ensure the UI reflects the change
			await updateSession({ force: true });
			toast.success("GitHub account disconnected successfully");
		} catch (error) {
			console.error("GitHub disconnect error:", error);
			toast.error("Failed to disconnect GitHub account. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			{isConnected ? (
				<div className={cn("flex flex-col items-center justify-center gap-1", className)}>
					<Link
						href={siteConfig.repo.url}
						className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Icons.github className="mr-2 h-4 w-4" />
						View Repository
					</Link>
					<Tooltip delayDuration={200}>
						<TooltipTrigger asChild>
							<Button
								onClick={() => void handleDisconnect()}
								variant="link"
								size="sm"
								disabled={isLoading}
								className="text-muted-foreground"
							>
								Not {githubUsername}? Click to disconnect.
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								{isConnected
									? `Remove GitHub repository access for ${githubUsername}`
									: "Connect your GitHub account"}
							</p>
						</TooltipContent>
					</Tooltip>
				</div>
			) : (
				<Button
					onClick={() => void handleConnect()}
					disabled={isLoading}
					className={cn("w-full", className)}
				>
					<Icons.github className="mr-2 h-4 w-4" />
					{isLoading ? "Connecting..." : "Connect GitHub"}
				</Button>
			)}
		</>
	);
};
