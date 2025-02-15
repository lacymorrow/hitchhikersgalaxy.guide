import { routes } from "@/config/routes";
import { createRepository, deploy, getDeploymentStatus, getVercelDeployUrl } from "@/server/actions/setup";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SetupWizard } from "./components/setup-wizard";
import { getGitHubDetails } from "./lib/get-github-details";
import { getRepoDetails } from "./lib/get-repo-details";
import { getVercelDetails } from "./lib/get-vercel-details";

export const dynamic = "force-dynamic";

async function checkSetupNeeded() {
	try {
		// Check if database is accessible
		await db.execute(sql`SELECT 1`);

		// Check if admin role exists and has permissions
		const adminRole = await db.query.roles.findFirst({
			where: (roles, { eq }) => eq(roles.name, "admin"),
			with: {
				permissions: {
					with: {
						permission: true,
					},
				},
			},
		});

		if (!adminRole) {
			return true; // Setup needed - no admin role exists
		}

		// Check if any user has the admin role
		const adminUser = await db.query.users.findFirst({
			where: (users, { eq }) => eq(users.role, "admin"),
		});

		return !adminUser; // Setup needed if no admin user exists
	} catch (error) {
		// If we can't connect to the database or there's any other error,
		// we assume setup is needed
		console.error("Error checking setup status:", error);
		return true;
	}
}

export default async function SetupPage() {
	const session = await auth();
	if (!session?.user) {
		redirect(routes.auth.signIn);
	}

	const needsSetup = await checkSetupNeeded();
	if (!needsSetup) {
		redirect(routes.app.dashboard);
	}

	// Get integration details
	const [githubDetails, vercelDetails, repoDetails] = await Promise.all([
		getGitHubDetails(session.user.id),
		getVercelDetails(session.user.id),
		getRepoDetails(),
	]);

	// Add required User fields
	const user = {
		...session.user,
		emailVerified: null, // or session.user.emailVerified if available
	};

	return (
		<div className="min-h-screen bg-background">
			<SetupWizard
				user={user}
				repoDetails={repoDetails}
				githubDetails={githubDetails}
				vercelDetails={vercelDetails}
				createRepository={createRepository}
				deploy={deploy}
				getDeploymentStatus={getDeploymentStatus}
				getVercelDeployUrl={getVercelDeployUrl}
			/>
		</div>
	);
}
