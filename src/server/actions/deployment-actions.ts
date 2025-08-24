"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { siteConfig } from "@/config/site-config";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { type Deployment, deployments, type NewDeployment } from "@/server/db/schema";
import { type DeploymentResult, deployPrivateRepository } from "./deploy-private-repo";

const SHIPKIT_REPO = `${siteConfig.repo.owner}/${siteConfig.repo.name}`;

/**
 * Validates a project name for use as a GitHub repository name
 * @param projectName - The project name to validate
 * @returns An error message if invalid, or null if valid
 */
function validateProjectName(projectName: string): string | null {
	// Check if project name is provided
	if (!projectName || projectName.trim() === "") {
		return "Project name is required";
	}

	// Trim the project name
	const trimmedName = projectName.trim();

	// Check length constraints (GitHub limits: 1-100 chars)
	if (trimmedName.length < 1 || trimmedName.length > 100) {
		return "Project name must be between 1 and 100 characters";
	}

	// GitHub repository name rules:
	// - Can only contain alphanumeric characters, hyphens, underscores, and dots
	// - Cannot start or end with a dot
	// - Cannot have consecutive dots
	// - Cannot be a reserved name
	const validNamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-_.])*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
	if (!validNamePattern.test(trimmedName)) {
		return "Project name can only contain letters, numbers, hyphens, underscores, and dots. It cannot start or end with a dot.";
	}

	// Check for consecutive dots
	if (trimmedName.includes("..")) {
		return "Project name cannot contain consecutive dots";
	}

	// Check for reserved names (common Git/GitHub reserved names)
	const reservedNames = [
		".git", ".github", "api", "www", "admin", "root", "master", "main",
		"undefined", "null", "con", "prn", "aux", "nul", "com1", "com2", 
		"com3", "com4", "com5", "com6", "com7", "com8", "com9", "lpt1", 
		"lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9"
	];
	if (reservedNames.includes(trimmedName.toLowerCase())) {
		return "This project name is reserved and cannot be used";
	}

	// Additional security checks for potential injection attempts
	const dangerousPatterns = [
		/[<>:"\/\\|?*]/, // Characters not allowed in filenames
		/\$\{.*\}/, // Template literals
		/\$\(.*\)/, // Command substitution
		/`.*`/, // Backticks
		/;|&&|\|\|/, // Command chaining
	];
	
	for (const pattern of dangerousPatterns) {
		if (pattern.test(trimmedName)) {
			return "Project name contains invalid characters";
		}
	}

	return null; // Valid project name
}

/**
 * Initiates a deployment process by creating a deployment record and
 * then calling the main deployment action.
 */
export async function initiateDeployment(formData: FormData): Promise<DeploymentResult> {
	const projectName = formData.get("projectName") as string;

	// Validate project name with comprehensive server-side validation
	const validationError = validateProjectName(projectName);
	if (validationError) {
		return {
			success: false,
			error: validationError,
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

		// Only trigger the deployment after the database record is successfully created
		// Use setTimeout to ensure the database transaction has fully committed
		// This prevents race conditions where the deployment starts before the DB commit
		setTimeout(() => {
			// Trigger the actual deployment in the background
			// Do not await this, as it can be a long-running process
			deployPrivateRepository({
				templateRepo: SHIPKIT_REPO,
				projectName: sanitizedProjectName,
				newRepoName: sanitizedProjectName,
				description,
				deploymentId: newDeployment.id,
			}).catch((error) => {
				console.error(`Deployment failed for ${sanitizedProjectName}:`, error);
				// Update the deployment status to failed if deployment errors occur
				updateDeployment(newDeployment.id, {
					status: "failed",
					error: error instanceof Error ? error.message : "An unknown error occurred",
				}).catch((updateError) => {
					console.error(`Failed to update deployment status for ${sanitizedProjectName}:`, updateError);
				});
			});
		}, 100); // Small delay to ensure DB transaction commits

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
