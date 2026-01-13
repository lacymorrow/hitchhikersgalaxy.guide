import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardVercelDeploy } from "@/components/modules/deploy/dashboard-vercel-deploy";
import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { createRedirectUrl } from "@/lib/utils/redirect";
import { getUserDeployments, initializeDemoDeployments } from "@/server/actions/deployment-actions";
import { auth } from "@/server/auth";
import type { Deployment } from "@/server/db/schema";
import { DeploymentsList } from "./deployments-list";

export const metadata: Metadata = constructMetadata({
	title: "Deployments",
	description: "Manage and monitor your application deployments. View deployment status, logs, and history.",
});

export default async function DeploymentsPage() {
	const session = await auth({ protect: true });

	// Defensive check: even with protect: true, ensure user exists
	if (!session?.user?.id) {
		redirect(createRedirectUrl(routes.auth.signIn, { nextUrl: routes.app.dashboard }));
	}

	let deployments: Deployment[] = [];

	try {
		deployments = await getUserDeployments();

		// Initialize demo data if no deployments exist
		if (process.env.NODE_ENV === "development" && deployments.length === 0) {
			await initializeDemoDeployments();
			deployments = await getUserDeployments();
		}
	} catch (error) {
		console.error("Failed to load deployments:", error);
	}

	return (
		<div className="container mx-auto py-10 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Deployments</h1>
					<p className="text-muted-foreground mt-2">
						Manage and monitor your Shipkit deployments to Vercel
					</p>
				</div>
				<DashboardVercelDeploy />
			</div>
			<DeploymentsList deployments={deployments} />
		</div>
	);
}
