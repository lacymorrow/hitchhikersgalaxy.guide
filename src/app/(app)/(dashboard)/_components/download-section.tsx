import { DownloadIcon } from "lucide-react";
import { GitHubOAuthButton } from "@/components/buttons/github-oauth-button";
import { BuyButton } from "@/components/buttons/lemonsqueezy-buy-button";
import { LoginButton } from "@/components/buttons/sign-in-button";
import { DashboardVercelDeploy } from "@/components/modules/deploy/dashboard-vercel-deploy";
import { Link } from "@/components/primitives/link";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { env } from "@/env";
import { cn } from "@/lib/utils";

interface DownloadSectionProps {
	isAuthenticated: boolean;
	isCustomer: boolean;
	hasGitHubConnection: boolean;
	githubUsername: string | null;
	hasVercelConnection: boolean;
}

export const DownloadSection = ({
	isAuthenticated,
	isCustomer,
	hasGitHubConnection,
	githubUsername,
	hasVercelConnection,
}: DownloadSectionProps) => {
	if (!isAuthenticated) {
		return (
			<div className="flex max-w-md flex-wrap items-stretch justify-stretch">
				<LoginButton size="lg" className="w-full">
					Sign in to download {siteConfig.title}
				</LoginButton>
			</div>
		);
	}

	if (!isCustomer) {
		return (
			<div className="flex max-w-md flex-wrap items-stretch justify-stretch">
				<BuyButton className="w-full" />
				<p className="mt-2 w-full text-sm text-muted-foreground">
					Purchase required to download {siteConfig.title}
				</p>
			</div>
		);
	}

	if (!env.NEXT_PUBLIC_FEATURE_DATABASE_ENABLED) {
		return null;
	}

	return (
		<div className="flex max-w-md flex-wrap items-stretch justify-stretch gap-3">
			<div className="flex w-full flex-wrap items-stretch justify-stretch gap-3">
				<Link
					href={routes.api.download}
					className={cn(buttonVariants({ variant: "default" }), "grow min-w-1/2 w-full")}
				>
					<DownloadIcon className="mr-2 h-4 w-4" />
					Download {siteConfig.title}
				</Link>
				{hasGitHubConnection && hasVercelConnection && (
					<DashboardVercelDeploy
						className="grow min-w-1/2"
						isVercelConnected={hasVercelConnection}
					/>
				)}
			</div>
			<GitHubOAuthButton
				className="w-full"
				isConnected={hasGitHubConnection}
				githubUsername={githubUsername}
			/>
		</div>
	);
};
