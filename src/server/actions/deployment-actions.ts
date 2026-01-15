"use server";

import { and, desc, eq, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { siteConfig } from "@/config/site-config";
import { validateProjectName } from "@/lib/schemas/deployment";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { type Deployment, deployments, type NewDeployment } from "@/server/db/schema";
import { type DeploymentResult, deployPrivateRepository } from "./deploy-private-repo";

const SHIPKIT_REPO = `${siteConfig.repo.owner}/${siteConfig.repo.name}`;

// Deployments stuck in "deploying" for longer than this are considered stale
const STALE_DEPLOYMENT_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Initiates a deployment process by creating a deployment record and
 * then calling the main deployment action.
 */
export async function initiateDeployment(formData: FormData): Promise<DeploymentResult> {
	// Get user session upfront - this must happen in the request context
	// before we start any background tasks
	const session = await auth();
	if (!session?.user?.id) {
		return {
			success: false,
			error: "Authentication required. Please log in to continue.",
		};
	}
	const userId = session.user.id;

	const projectName = formData.get("projectName") as string;

	// Validate project name with comprehensive server-side validation using shared schema
	const validation = validateProjectName(projectName);
	if (!validation.isValid) {
		return {
			success: false,
			error: validation.error,
		};
	}

	// Sanitize the project name (trim whitespace)
	const sanitizedProjectName = projectName.trim();

	const description = `Deployment of ${sanitizedProjectName}`;

	try {
		// Create a new deployment record first
		// This will throw an error if the database operation fails
		const newDeployment = await createDeployment({
			projectName: sanitizedProjectName,
			description,
			status: "deploying",
		});

		// Trigger the actual deployment in the background with proper error handling
		// This allows the server action to return immediately while deployment continues
		// IMPORTANT: We pass userId because auth() won't work in background tasks
		void (async () => {
			try {
				await deployPrivateRepository({
					templateRepo: SHIPKIT_REPO,
					projectName: sanitizedProjectName,
					description,
					deploymentId: newDeployment.id,
					userId, // Pass userId for background task
				});
				console.log(`Deployment process completed for ${sanitizedProjectName}`);
			} catch (error) {
				console.error(`Deployment failed for ${sanitizedProjectName}:`, error);
				// Update the deployment status to failed if deployment errors occur
				try {
					await updateDeployment(
						newDeployment.id,
						{
							status: "failed",
							error: error instanceof Error ? error.message : "An unknown error occurred",
						},
						userId // Pass userId for background task
					);
				} catch (updateError) {
					console.error(
						`Failed to update deployment status for ${sanitizedProjectName}:`,
						updateError
					);
				}
			}
		})();

		// Return a success response immediately
		return {
			success: true,
			message: "Deployment initiated successfully! You can monitor the progress on this page.",
			data: {
				githubRepo: undefined,
				vercelProject: undefined,
			},
		};
	} catch (error) {
		console.error(`Failed to create deployment record for ${sanitizedProjectName}:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to create deployment record",
		};
	}
}

/**
 * Get all deployments for the current user.
 * Automatically marks stale "deploying" deployments as timed out.
 */
export async function getUserDeployments(): Promise<Deployment[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	if (!db) {
		throw new Error("Database not available");
	}

	try {
		// First, mark any stale deployments as timed out
		await markStaleDeploymentsAsTimedOut(session.user.id);

		const userDeployments = await db
			.select()
			.from(deployments)
			.where(eq(deployments.userId, session.user.id))
			.orderBy(desc(deployments.createdAt));

		return userDeployments;
	} catch (error) {
		console.error("Failed to fetch deployments:", error);
		throw new Error("Failed to fetch deployments");
	}
}

/**
 * Mark deployments that have been stuck in "deploying" state for too long as timed out
 */
async function markStaleDeploymentsAsTimedOut(userId: string): Promise<void> {
	if (!db) return;

	const staleThreshold = new Date(Date.now() - STALE_DEPLOYMENT_THRESHOLD_MS);

	try {
		const result = await db
			.update(deployments)
			.set({
				status: "timeout",
				error: "Deployment timed out - the deployment process did not complete in the expected time",
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(deployments.userId, userId),
					eq(deployments.status, "deploying"),
					lt(deployments.createdAt, staleThreshold)
				)
			);
	} catch (error) {
		// Log but don't fail the main request
		console.error("Failed to mark stale deployments as timed out:", error);
	}
}

/**
 * Create a new deployment record
 */
export async function createDeployment(
	data: Omit<NewDeployment, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Deployment> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	if (!db) {
		throw new Error("Database not available");
	}

	try {
		// Use a transaction to ensure atomicity
		const result = await db.transaction(async (tx) => {
			const [newDeployment] = await tx
				.insert(deployments)
				.values({
					...data,
					userId: session.user.id,
				})
				.returning();

			return newDeployment;
		});

		// Only revalidate after successful transaction commit
		revalidatePath("/deployments");
		if (!result) {
			throw new Error("Failed to create deployment: no result returned");
		}
		return result;
	} catch (error) {
		console.error("Failed to create deployment:", error);
		throw new Error("Failed to create deployment");
	}
}

/**
 * Update an existing deployment
 * @param id - The deployment ID
 * @param data - The data to update
 * @param userId - Optional user ID for background tasks where auth() won't work
 */
export async function updateDeployment(
	id: string,
	data: Partial<Omit<Deployment, "id" | "userId" | "createdAt">>,
	userId?: string
): Promise<Deployment | null> {
	// Use provided userId (for background tasks) or get from auth
	let effectiveUserId = userId;

	if (!effectiveUserId) {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error("Unauthorized");
		}
		effectiveUserId = session.user.id;
	}

	if (!db) {
		throw new Error("Database not available");
	}

	try {
		const [updatedDeployment] = await db
			.update(deployments)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(and(eq(deployments.id, id), eq(deployments.userId, effectiveUserId)))
			.returning();

		if (updatedDeployment) {
			revalidatePath("/deployments");
		}

		return updatedDeployment || null;
	} catch (error) {
		console.error("Failed to update deployment:", error);
		throw new Error("Failed to update deployment");
	}
}

/**
 * Delete a deployment record
 */
export async function deleteDeployment(id: string): Promise<boolean> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	if (!db) {
		throw new Error("Database not available");
	}

	try {
		const result = await db
			.delete(deployments)
			.where(and(eq(deployments.id, id), eq(deployments.userId, session.user.id)));

		revalidatePath("/deployments");
		return true;
	} catch (error) {
		console.error("Failed to delete deployment:", error);
		throw new Error("Failed to delete deployment");
	}
}

/**
 * Cancel a deployment that is stuck in "deploying" state
 */
export async function cancelDeployment(id: string): Promise<Deployment | null> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	if (!db) {
		throw new Error("Database not available");
	}

	try {
		// Only allow canceling deployments that are in "deploying" state
		const [existingDeployment] = await db
			.select()
			.from(deployments)
			.where(and(eq(deployments.id, id), eq(deployments.userId, session.user.id)))
			.limit(1);

		if (!existingDeployment) {
			throw new Error("Deployment not found");
		}

		if (existingDeployment.status !== "deploying") {
			throw new Error("Can only cancel deployments that are in progress");
		}

		const [canceledDeployment] = await db
			.update(deployments)
			.set({
				status: "failed",
				error: "Deployment was canceled by user",
				updatedAt: new Date(),
			})
			.where(and(eq(deployments.id, id), eq(deployments.userId, session.user.id)))
			.returning();

		if (canceledDeployment) {
			revalidatePath("/deployments");
		}

		return canceledDeployment || null;
	} catch (error) {
		console.error("Failed to cancel deployment:", error);
		throw error instanceof Error ? error : new Error("Failed to cancel deployment");
	}
}

/**
 * Initialize demo deployments for new users
 */
export async function initializeDemoDeployments(): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	if (!db) {
		throw new Error("Database not available");
	}

	try {
		// Check if user already has deployments
		const existingDeployments = await db
			.select()
			.from(deployments)
			.where(eq(deployments.userId, session.user.id))
			.limit(1);

		if (existingDeployments.length > 0) {
			return; // User already has deployments
		}

		// Create demo deployments
		const demoDeployments: Omit<NewDeployment, "id" | "createdAt" | "updatedAt">[] = [
			{
				userId: session.user.id,
				projectName: "my-shipkit-app",
				description: "Production deployment",
				githubRepoUrl: "https://github.com/demo/my-shipkit-app",
				githubRepoName: "demo/my-shipkit-app",
				vercelProjectUrl: "https://vercel.com/demo/my-shipkit-app",
				vercelDeploymentUrl: "https://my-shipkit-app.vercel.app",
				status: "completed",
			},
			{
				userId: session.user.id,
				projectName: "shipkit-staging",
				description: "Staging environment",
				githubRepoUrl: "https://github.com/demo/shipkit-staging",
				githubRepoName: "demo/shipkit-staging",
				vercelProjectUrl: "https://vercel.com/demo/shipkit-staging",
				vercelDeploymentUrl: "https://shipkit-staging.vercel.app",
				status: "completed",
			},
			{
				userId: session.user.id,
				projectName: "shipkit-dev",
				description: "Development environment",
				status: "failed",
				error: "Build failed: Module not found",
			},
		];

		await db.insert(deployments).values(demoDeployments);
		// Avoid calling revalidatePath here because this function can be executed during
		// a Server Component render (e.g., first-visit demo data). Revalidation during
		// render is unsupported in Next.js and triggers runtime errors. The page
		// explicitly refetches deployments after this runs, so no revalidation is needed.
	} catch (error) {
		console.error("Failed to initialize demo deployments:", error);
		// Don't throw - this is not critical
	}
}
