"use client";

import { DiscordLogoIcon, GitHubLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import { IconBrandBitbucket, IconBrandGitlab } from "@tabler/icons-react";
import { cva } from "class-variance-authority";
import { ChevronsUpDownIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icons } from "@/components/assets/icons";
import { Divider } from "@/components/primitives/divider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { env } from "@/env";
import { cn } from "@/lib/utils";
import { signInWithOAuthAction } from "@/server/actions/auth";
import { enabledAuthProviders, isGuestOnlyMode } from "@/server/auth-providers-utils";
import { MagicLinkForm } from "./magic-link-form";

const oauthButtonVariants = cva("flex items-center justify-center gap-sm", {
	variants: {
		variant: {
			default: "w-full",
			icons: "w-auto p-2",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

interface OAuthButtonsProps {
	variant?: "default" | "icons";
	className?: string;
	collapsible?: boolean;
}

interface Provider {
	id: string;
	name: string;
	isExcluded?: boolean;
}

export function OAuthButtons({
	variant = "default",
	className,
	collapsible = false,
}: OAuthButtonsProps) {
	// Redirect back to the page that the user was on before signing in
	const searchParams = useSearchParams();
	const nextUrl = searchParams?.get(SEARCH_PARAM_KEYS.nextUrl);
	const options = nextUrl ? { redirectTo: nextUrl } : {};
	const [currentVariant, setCurrentVariant] = useState<"default" | "icons">(variant);

	const handleSignIn = (providerId: string) => {
		void signInWithOAuthAction({ providerId, options });
	};

	const toggleVariant = () => {
		setCurrentVariant(currentVariant === "default" ? "icons" : "default");
	};

	// Filter out guest provider as it needs special handling
	const oauthProviders = enabledAuthProviders.filter((provider) => provider.id !== "guest");

	// Don't render OAuth buttons if in guest-only mode
	if (isGuestOnlyMode) {
		return null;
	}

	const MagicLinkContent = () => {
		return (
			<div className="space-y-4 pt-4">
				<Divider text="Get a magic link" />
				<MagicLinkForm />
			</div>
		);
	};

	return (
		<>
			<div
				className={cn(
					"relative flex gap-xs w-full items-center",
					currentVariant === "icons" ? "flex-row justify-center" : "flex-col items-stretch",
					className
				)}
			>
				{collapsible && (
					<div
						className={cn(
							"flex justify-center items-center",
							currentVariant === "icons" ? "order-last" : "absolute right-1 top-[2px]"
						)}
					>
						<Button variant="ghost" size="sm" onClick={toggleVariant} className="text-xs">
							<ChevronsUpDownIcon className="h-4 w-4" />
						</Button>
					</div>
				)}

				{oauthProviders.map((provider) => {
					const { id, name, isExcluded } = provider;

					if (isExcluded) {
						return null;
					}

					const button = (
						<Button
							variant={"outline"}
							type="submit"
							className={oauthButtonVariants({ variant: currentVariant })}
						>
							{currentVariant === "default" && <span>Sign in with {name}</span>}
							{id === "google" && <Icons.google className="h-4 w-4" />}
							{id === "twitter" && <TwitterLogoIcon className="h-4 w-4" />}
							{id === "discord" && <DiscordLogoIcon className="h-4 w-4" />}
							{id === "github" && <GitHubLogoIcon className="h-4 w-4" />}
							{id === "gitlab" && <IconBrandGitlab className="h-4 w-4" />}
							{id === "bitbucket" && <IconBrandBitbucket className="h-4 w-4" />}
						</Button>
					);

					return (
						<form
							key={id}
							action={() => {
								handleSignIn(id);
							}}
						>
							{currentVariant === "icons" ? (
								<Tooltip>
									<TooltipTrigger asChild>{button}</TooltipTrigger>
									<TooltipContent>
										<p>Sign in with {name}</p>
									</TooltipContent>
								</Tooltip>
							) : (
								button
							)}
						</form>
					);
				})}
			</div>

			{env.NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED && <MagicLinkContent />}
		</>
	);
}
