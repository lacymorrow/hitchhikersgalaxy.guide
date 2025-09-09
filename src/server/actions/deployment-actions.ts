"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { siteConfig } from "@/config/site-config";
import { deploymentSchema, validateProjectName } from "@/lib/schemas/deployment";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { type Deployment, deployments, type NewDeployment } from "@/server/db/schema";
import { type DeploymentResult, deployPrivateRepository } from "./deploy-private-repo";

const SHIPKIT_REPO = `${siteConfig.repo.owner}/${siteConfig.repo.name}`;

/**
 * Initiates a deployment process by creating a deployment record and
 * then calling the main deployment action.
 */
export async function initiateDeployment(formData: FormData): Promise<DeploymentResult> {
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
		void (async () => {
			try {
				await deployPrivateRepository({
					templateRepo: SHIPKIT_REPO,
					projectName: sanitizedProjectName,
					description,
					deploymentId: newDeployment.id,
				});
				console.log(`Deployment process completed for ${sanitizedProjectName}`);
			} catch (error) {
				console.error(`Deployment failed for ${sanitizedProjectName}:`, error);
				// Update the deployment status to failed if deployment errors occur
				try {
					await updateDeployment(newDeployment.id, {
						status: "failed",
						error: error instanceof Error ? error.message : "An unknown error occurred",
					});
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
 * Get all deployments for the current user
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
 */
export async function updateDeployment(
	id: string,
	data: Partial<Omit<Deployment, "id" | "userId" | "createdAt">>
): Promise<Deployment | null> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
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
			.where(and(eq(deployments.id, id), eq(deployments.userId, session.user.id)))
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
