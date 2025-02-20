"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const VercelConnectButton = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { toast } = useToast();

	const handleConnect = async () => {
		try {
			setIsLoading(true);

			// Get the OAuth URL from our backend
			const response = await fetch("/api/setup/vercel-auth-url");
			if (!response.ok) {
				throw new Error(await response.text());
			}

			const { url } = await response.json();

			// Open Vercel OAuth page in a popup
			const width = 600;
			const height = 700;
			const left = window.screenX + (window.outerWidth - width) / 2;
			const top = window.screenY + (window.outerHeight - height) / 2;

			const popup = window.open(
				url,
				"Connect to Vercel",
				`width=${width},height=${height},left=${left},top=${top}`
			);

			// Listen for the OAuth callback
			window.addEventListener("message", async (event) => {
				// Verify origin
				if (event.origin !== window.location.origin) return;

				// Handle the OAuth callback
				if (event.data?.type === "vercel-oauth-success") {
					popup?.close();
					toast({
						title: "Success",
						description: "Successfully connected to Vercel!",
					});
					// Refresh the page to update the auth state
					window.location.reload();
				}

				if (event.data?.type === "vercel-oauth-error") {
					popup?.close();
					toast({
						title: "Error",
						description: event.data.error || "Failed to connect to Vercel",
						variant: "destructive",
					});
				}
			});
		} catch (error) {
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : "Failed to connect to Vercel",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			onClick={handleConnect}
			disabled={isLoading}
			className="bg-black hover:bg-gray-900 text-white"
		>
			{isLoading ? (
				"Connecting..."
			) : (
				<div className="flex items-center space-x-2">
					<svg
						aria-hidden="true"
						width="16"
						height="16"
						viewBox="0 0 76 65"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="white" />
					</svg>
					<span>Connect to Vercel</span>
				</div>
			)}
		</Button>
	);
};
