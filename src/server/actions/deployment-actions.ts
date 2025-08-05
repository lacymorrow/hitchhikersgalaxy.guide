"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { type Deployment, deployments, type NewDeployment } from "@/server/db/schema";
import { siteConfig } from "@/config/site-config";
import { deployPrivateRepository, type DeploymentResult } from "./deploy-private-repo";

const SHIPKIT_REPO = `${siteConfig.repo.owner}/${siteConfig.repo.name}`;

/**
 * Initiates a deployment process by creating a deployment record and
 * then calling the main deployment action.
 */
export async function initiateDeployment(formData: FormData): Promise<DeploymentResult> {
	const projectName = formData.get("projectName") as string;

	if (!projectName) {
		return {
			success: false,
			error: "Project name is required",
		};
	}

	const description = `Deployment of ${projectName}`;

	// Create a new deployment record first
	const newDeployment = await createDeployment({
		projectName,
		description,
		status: "deploying",
	});

	// Trigger the actual deployment in the background
	// Do not await this, as it can be a long-running process
	deployPrivateRepository({
		templateRepo: SHIPKIT_REPO,
		projectName,
		newRepoName: projectName,
		description,
		deploymentId: newDeployment.id,
	}).catch((error) => {
		console.error(`Deployment failed for ${projectName}:`, error);
		updateDeployment(newDeployment.id, {
			status: "failed",
			error: error instanceof Error ? error.message : "An unknown error occurred",
		});
	});

	// Return a success response immediately
	return {
		success: true,
		message: "Deployment initiated successfully! You can monitor the progress on this page.",
		data: {
			githubRepo: undefined,
			vercelProject: undefined,
		},
	};
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
		const [newDeployment] = await db
			.insert(deployments)
			.values({
				...data,
				userId: session.user.id,
			})
			.returning();

		revalidatePath("/deployments");
		return newDeployment;
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
		revalidatePath("/deployments");
	} catch (error) {
		console.error("Failed to initialize demo deployments:", error);
		// Don't throw - this is not critical
	}
}
