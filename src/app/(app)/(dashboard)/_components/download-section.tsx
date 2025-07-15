import { DownloadIcon } from "lucide-react";
import type { Session } from "next-auth";
import { GitHubConnectButton } from "@/components/buttons/github-connect-button";
import { GitHubConnectDialog } from "@/components/buttons/github-connect-dialog";
import { BuyButton } from "@/components/buttons/lemonsqueezy-buy-button";
import { LoginButton } from "@/components/buttons/sign-in-button";
import { VercelDeployButton } from "@/components/shipkit/vercel-deploy-button";
import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/config/base-url";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { downloadRepo } from "@/server/actions/github/download-repo";
import { auth } from "@/server/auth";
import { apiKeyService } from "@/server/services/api-key-service";
import { checkGitHubConnection } from "@/server/services/github/github-service";
import { checkVercelConnection } from "@/server/services/vercel/vercel-service";

interface DownloadSectionProps {
	isCustomer: boolean;
}

export const DownloadSection = async ({ isCustomer }: DownloadSectionProps) => {
	const session = (await auth()) as Session | null;

	// If not authenticated, show login button
	if (!session?.user) {
		return (
			<div className="flex flex-wrap items-stretch justify-stretch max-w-md">
				<LoginButton size="lg" className="w-full">
					Sign in to download {siteConfig.title}
				</LoginButton>
			</div>
		);
	}

	const userId = session.user.id;

	// If authenticated but not purchased, show buy button
	if (!isCustomer) {
		return (
			<div className="flex flex-wrap items-stretch justify-stretch max-w-md">
				<BuyButton className="w-full" />
				<p className="w-full text-sm text-muted-foreground mt-2">
					Purchase required to download {siteConfig.title}
				</p>
			</div>
		);
	}

	// Run all async operations in parallel
	const [userApiKeys, isGitHubConnected, isVercelConnected] = await Promise.all([
		apiKeyService.getUserApiKeys(userId),
		checkGitHubConnection(userId),
		checkVercelConnection(userId),
	]);

	// Get the user's API key
	let apiKey: string | undefined;
	if (userApiKeys && userApiKeys.length > 0) {
		apiKey = userApiKeys[0].apiKey.key;
	}

	// Redirect after deploy to /vercel/deploy/${apiKey}
	const deployUrl = new URL(routes.external.vercelDeployShipkit);
	const redirectUrl = deployUrl.searchParams.get("redirect-url");
	if (apiKey) {
		deployUrl.searchParams.set(
			"redirect-url",
			encodeURIComponent(`${redirectUrl ?? BASE_URL}${routes.vercelDeploy}/${apiKey}`)
		);
	}
	const vercelDeployHref = deployUrl.toString();

	// User is authenticated and has purchased, show download options
	return (
		<div className="flex flex-wrap items-stretch justify-stretch max-w-md gap-3">
			<div className="flex flex-wrap items-stretch justify-stretch w-full gap-3">
				{/* Download button */}
				<form action={downloadRepo} className="grow">
					<input type="hidden" name="email" value={session.user.email} />
					<Button type="submit" size="lg" className="w-full">
						<DownloadIcon className="mr-2 h-4 w-4" />
						Download {siteConfig.title}
					</Button>
				</form>

				{isVercelConnected && <VercelDeployButton className="grow" href={vercelDeployHref} />}
			</div>
			{/* GitHub connection section */}
			{isGitHubConnected ? (
				<GitHubConnectButton className="w-full" />
			) : (
				<GitHubConnectDialog className="w-full" />
			)}
		</div>
	);
};
