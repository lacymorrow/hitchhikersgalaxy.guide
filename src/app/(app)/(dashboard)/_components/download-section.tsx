import { DownloadIcon } from "lucide-react";
import { GitHubConnectButton } from "@/components/buttons/github-connect-button";
import { BuyButton } from "@/components/buttons/lemonsqueezy-buy-button";
import { LoginButton } from "@/components/buttons/sign-in-button";
import { DashboardVercelDeploy } from "@/components/modules/deploy/dashboard-vercel-deploy";
import { siteConfig } from "@/config/site-config";
import { downloadRepo } from "@/server/actions/github/download-repo";
import { auth } from "@/server/auth";
import { checkGitHubConnection } from "@/server/services/github/github-service";
import { checkVercelConnection } from "@/server/services/vercel/vercel-service";
import { DownloadSubmitButton } from "./download-submit-button";
import { GitHubIntegration } from "@/app/(app)/install/_components/github-integration";
import { PrivateRepoDeployButton } from "@/components/modules/deploy/private-repo-deploy-button";

interface DownloadSectionProps {
    isCustomer: boolean;
}

export const DownloadSection = async ({ isCustomer }: DownloadSectionProps) => {
    const session = await auth();

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
    const [_isGitHubConnected, isVercelConnected] = await Promise.all([
        checkGitHubConnection(userId),
        checkVercelConnection(userId),
    ]);

    // User is authenticated and has purchased, show download options
    return (
        <div className="flex flex-wrap items-stretch justify-stretch max-w-md gap-3">
            <div className="flex flex-wrap items-stretch justify-stretch w-full gap-3">
                <GitHubIntegration changedFiles={[]} />
                <PrivateRepoDeployButton />
                {/* Download button */}
                <form action={downloadRepo} className="grow min-w-1/2">
                    <input type="hidden" name="email" value={session.user.email} />
                    <DownloadSubmitButton className="w-full">
                        <>
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download {siteConfig.title}
                        </>
                    </DownloadSubmitButton>
                </form>

                {isVercelConnected && <DashboardVercelDeploy className="grow min-w-1/2" isVercelConnected={isVercelConnected} />}
            </div>
            {/* GitHub connection section */}
            <GitHubConnectButton className="w-full" />
        </div>
    );
};
