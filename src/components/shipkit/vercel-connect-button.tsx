"use client";

import { IconBrandVercelFilled } from "@tabler/icons-react";
import crypto from "crypto";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "@/components/primitives/link-with-transition";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { disconnectAccount, markVercelConnectionAttempt } from "@/server/actions/settings";
import type { User } from "@/types/user";

interface VercelConnectButtonProps {
	className?: string;
	user?: User;
}

export const VercelConnectButton = ({ className, user }: VercelConnectButtonProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const { update: updateSession } = useSession();
	const { toast: legacyToast } = useToast();

	useEffect(() => {
		// Check if the user has a Vercel account
		const hasVercelAccount = user?.accounts?.some((account) => account.provider === "vercel");
		setIsConnected(!!hasVercelAccount);
	}, [user]);

	if (!process.env.NEXT_PUBLIC_VERCEL_INTEGRATION_SLUG) {
		return null;
	}

	const handleConnect = async () => {
		try {
			setIsLoading(true);

			// Record the connection attempt in the database
			await markVercelConnectionAttempt();

			// the integration URL slug from vercel
			const client_slug = process.env.NEXT_PUBLIC_VERCEL_INTEGRATION_SLUG;

			// create a CSRF token and store it locally
			const state = crypto.randomBytes(16).toString("hex");
			localStorage.setItem("latestCSRFToken", state);

			// Get the origin for the callback URL
			const origin = window.location.origin;

			// Create the redirect URI
			const redirectUri = `${origin}/connect/vercel/auth`;

			// redirect the user to vercel with the callback URL
			// Use redirectUri as the parameter name for consistency with the OAuth spec
			const link = `https://vercel.com/integrations/${client_slug}/new?state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
			window.location.assign(link);
		} catch (error) {
			legacyToast({
				title: "Error",
				description: error instanceof Error ? error.message : "Failed to connect to Vercel",
				variant: "destructive",
			});
			setIsLoading(false);
		}
	};

	const handleDisconnect = async () => {
		if (isLoading) return;

		setIsLoading(true);
		try {
			const result = await disconnectAccount("vercel");

			if (!result.success) {
				toast.error(result.error ?? "Failed to disconnect Vercel account");
				return;
			}

			toast.success(result.message);

			// Force a full session update to ensure the UI reflects the change
			await updateSession({ force: true });
		} catch (error) {
			console.error("Disconnect Vercel error:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			{isConnected ? (
				<div className={cn("flex flex-col items-center justify-center gap-1", className)}>
					<Link
						href="https://vercel.com/dashboard"
						className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
						target="_blank"
						rel="noopener noreferrer"
					>
						<IconBrandVercelFilled className="mr-2 h-4 w-4" />
						View Vercel Dashboard
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
								Connected - Click to disconnect
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Remove Vercel account connection</p>
						</TooltipContent>
					</Tooltip>
				</div>
			) : (
				<Button onClick={handleConnect} disabled={isLoading} className={cn("", className)}>
					<IconBrandVercelFilled className="mr-2 h-4 w-4" />
					{isLoading ? "Connecting..." : "Connect Vercel"}
				</Button>
			)}
		</>
	);
};
