"use client";

import { Icons } from "@/components/images/icons";
import { Link } from "@/components/primitives/link-with-transition";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { disconnectGitHub, verifyGitHubUsername } from "@/server/actions/github";
import { useSession } from "next-auth/react";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GitHubSession {
	user: {
		id: string;
		email: string;
		githubUsername?: string | null;
	};
}

export const GitHubConnectButton = ({ className }: { className?: string }) => {
	const { data: session, update: updateSession } = useSession();
	const [isLoading, setIsLoading] = useState(false);
	const [username, setUsername] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const user = (session as GitHubSession)?.user;
	const githubUsername = user?.githubUsername;
	const isConnected = !!githubUsername;

	const handleConnect = async (e: FormEvent) => {
		e.preventDefault();
		if (!username) return;

		try {
			setIsLoading(true);
			await verifyGitHubUsername(username);
			await updateSession();
			setIsDialogOpen(false);
			toast.success("GitHub username verified successfully");
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : "Failed to verify GitHub username");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDisconnect = async () => {
		if (!user?.id) return;

		try {
			setIsLoading(true);
			await disconnectGitHub();
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
		<Tooltip>
			<TooltipTrigger asChild>
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
						<Button
							onClick={() => void handleDisconnect()}
							variant="link"
							size="sm"
							disabled={isLoading}
							className="text-muted-foreground"
						>
							Not {githubUsername}? Click to disconnect.
						</Button>
					</div>
				) : (
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button disabled={isLoading} className={cn(className)}>
								<Icons.github className="mr-2 h-4 w-4" />
								{isLoading ? "Connecting..." : "Connect GitHub"}
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Connect GitHub Account</DialogTitle>
							</DialogHeader>
							<form onSubmit={handleConnect} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="username">GitHub Username</Label>
									<Input
										id="username"
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										placeholder="Enter your GitHub username"
										disabled={isLoading}
										required
									/>
								</div>
								<Button type="submit" disabled={isLoading} className="w-full">
									{isLoading ? "Verifying..." : "Verify Username"}
								</Button>
							</form>
						</DialogContent>
					</Dialog>
				)}
			</TooltipTrigger>
			<TooltipContent>
				<p>
					{isConnected
						? `Remove GitHub repository access for ${githubUsername}`
						: "Enter your GitHub username"}
				</p>
			</TooltipContent>
		</Tooltip>
	);
};
