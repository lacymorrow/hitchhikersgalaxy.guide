"use server";

import { redirect } from "next/navigation";
import { createGitHubTemplateService } from "@/lib/github-template";
import { COMMON_ENV_VARIABLES, createVercelAPIService } from "@/lib/vercel-api";
import { auth } from "@/server/auth";
import { getVercelAccessToken } from "@/server/services/vercel/vercel-service";

/**
 * Server actions for private repository deployment
 */

// Define a common type for environment variable targets
type EnvVarTarget =
	| ReadonlyArray<"production" | "preview" | "development">
	| ("production" | "preview" | "development")[];

export interface DeploymentConfig {
	templateRepo: string; // e.g., "shipkit/private-template"
	newRepoName: string;
	projectName: string;
	description?: string;
	environmentVariables?: Array<{
		key: string;
		value: string;
		target: EnvVarTarget;
	}>;
	domains?: string[];
	includeAllBranches?: boolean;
	githubToken: string;
}

export interface DeploymentResult {
	success: boolean;
	message?: string;
	error?: string;
	data?: {
		githubRepo?: {
			url: string;
			name: string;
			cloneUrl: string;
		};
		vercelProject?: {
			projectId: string;
			projectUrl: string;
			deploymentId?: string;
			deploymentUrl?: string;
		};
		step?: string;
		details?: any;
	};
}

/**
 * Deploy a private repository template to user's GitHub and Vercel accounts
 */
export async function deployPrivateRepository(config: DeploymentConfig): Promise<DeploymentResult> {
	const session = await auth();

	// Handle NextResponse type from auth function when redirecting
	if (!session || (typeof session === "object" && "status" in session)) {
		return {
			success: false,
			error: "Authentication required. Please log in to continue.",
		};
	}

	if (!session.user?.id) {
		return {
			success: false,
			error: "Authentication required. Please log in to continue.",
		};
	}

	// Get user's GitHub token from the config (still needed for private template access)
	const {
		templateRepo,
		newRepoName,
		projectName,
		description,
		environmentVariables = [],
		githubToken,
	} = config;

	// Get user's Vercel access token using the service
	const vercelToken = await getVercelAccessToken(session.user.id);

	if (!vercelToken) {
		return {
			success: false,
			error: "Vercel account not connected. Please connect your Vercel account in Settings first.",
		};
	}

	try {
		// Validate configuration
		const validation = await validateDeploymentConfig({
			templateRepo,
			projectName,
			githubToken,
			vercelToken,
		});

		if (!validation.success) {
			return {
				success: false,
				error: validation.error || "Configuration validation failed",
			};
		}

		console.log(`🚀 Starting deployment: ${templateRepo} → ${projectName}`);

		// Parse templateRepo to get owner and repo name
		const [templateOwner, templateRepoName] = templateRepo.split("/");
		if (!templateOwner || !templateRepoName) {
			return {
				success: false,
				error: "Template repository must be in format 'owner/repo-name'",
			};
		}

		// Step 1: Create GitHub repository from template
		const githubService = createGitHubTemplateService(githubToken);

		// Get the authenticated GitHub user to get their username
		const userInfo = await githubService.getCurrentUserInfo();
		if (!userInfo.success || !userInfo.username) {
			return {
				success: false,
				error:
					userInfo.error ||
					"Failed to get GitHub user information. Please check your access token.",
			};
		}

		const githubUsername = userInfo.username;

		const repoResult = await githubService.createFromTemplate({
			templateOwner,
			templateRepo: templateRepoName,
			newRepoName: projectName,
			newRepoOwner: githubUsername,
			description: description || `Deployed from ${templateRepo} template`,
			private: false, // Make it public so Vercel can access it
		});

		if (!repoResult.success) {
			return {
				success: false,
				error: repoResult.error || "Failed to create GitHub repository",
				data: {
					step: "github-repo-creation",
					details: repoResult.error,
				},
			};
		}

		console.log(`✅ GitHub repository created: ${repoResult.repoUrl}`);

		// Extract repo info from the result
		const repoInfo = {
			url: repoResult.repoUrl!,
			name: projectName,
			cloneUrl: repoResult.details?.cloneUrl || repoResult.repoUrl!,
		};

		// Step 2: Create Vercel project
		const vercelService = createVercelAPIService(vercelToken);

		const projectResult = await vercelService.createProject({
			name: projectName,
			gitRepository: {
				type: "github" as const,
				repo: `${githubUsername}/${projectName}`,
			},
			framework: "nextjs",
			environmentVariables: [
				...COMMON_ENV_VARIABLES.nextjs,
				...COMMON_ENV_VARIABLES.shipkit,
				...environmentVariables,
			],
		});

		if (!projectResult.success || !projectResult.projectId) {
			return {
				success: false,
				error: projectResult.error || "Failed to create Vercel project",
				data: {
					step: "vercel-project-creation",
					details: projectResult.error,
					githubRepo: repoInfo,
				},
			};
		}

		console.log(`✅ Vercel project created: ${projectResult.projectUrl}`);

		// Step 3: Trigger initial deployment
		const deploymentResult = await vercelService.createDeployment(projectResult.projectId!);

		// Return success with complete deployment information
		return {
			success: true,
			message: `Successfully deployed ${templateRepo} as ${projectName}`,
			data: {
				githubRepo: repoInfo,
				vercelProject: {
					projectId: projectResult.projectId!,
					projectUrl: projectResult.projectUrl!,
					deploymentId: deploymentResult.success ? deploymentResult.deploymentId : undefined,
					deploymentUrl: deploymentResult.success ? deploymentResult.deploymentUrl : undefined,
				},
			},
		};
	} catch (error) {
		console.error("❌ Deployment failed:", error);

		const errorMessage = error instanceof Error ? error.message : "Unknown deployment error";

		return {
			success: false,
			error: `Deployment failed: ${errorMessage}`,
			data: {
				step: "deployment-error",
				details: errorMessage,
			},
		};
	}
}

/**
 * Validate deployment configuration before attempting deployment
 */
export async function validateDeploymentConfig(config: {
	templateRepo: string;
	projectName: string;
	githubToken: string;
	vercelToken: string;
}): Promise<{ success: boolean; error?: string }> {
	const { templateRepo, projectName, githubToken, vercelToken } = config;

	// Validate template repo format
	if (!templateRepo || !templateRepo.includes("/")) {
		return {
			success: false,
			error: "Template repository must be in format 'owner/repo-name'",
		};
	}

	// Validate project name
	if (!projectName || projectName.length < 3) {
		return {
			success: false,
			error: "Project name must be at least 3 characters long",
		};
	}

	// Validate project name format (Vercel requirements)
	if (!/^[a-z0-9-]+$/.test(projectName)) {
		return {
			success: false,
			error: "Project name can only contain lowercase letters, numbers, and hyphens",
		};
	}

	if (!githubToken) {
		return {
			success: false,
			error: "GitHub access token is required",
		};
	}

	if (!vercelToken) {
		return {
			success: false,
			error: "Vercel access token is required",
		};
	}

	return { success: true };
}

/**
 * Check availability of repository and project names
 */
export async function checkNameAvailability(
	repoName: string,
	projectName: string,
	githubToken: string,
	vercelToken: string
): Promise<{
	github: { available: boolean; error?: string };
	vercel: { available: boolean; error?: string };
}> {
	const results: {
		github: { available: boolean; error?: string };
		vercel: { available: boolean; error?: string };
	} = {
		github: { available: false },
		vercel: { available: false },
	};

	try {
		const session = await auth();

		// Handle NextResponse type from auth function when redirecting
		if (!session || (typeof session === "object" && "status" in session)) {
			throw new Error("Authentication required");
		}

		if (!session.user?.email) {
			throw new Error("Authentication required");
		}

		// Check GitHub availability
		try {
			const githubService = createGitHubTemplateService(githubToken);
			results.github.available = await githubService.isRepositoryNameAvailable(
				session.user.email,
				repoName
			);
		} catch (error: any) {
			results.github.error = error.message;
		}

		// Check Vercel availability
		try {
			const vercelService = createVercelAPIService(vercelToken);
			results.vercel.available = await vercelService.isProjectNameAvailable(projectName);
		} catch (error: any) {
			results.vercel.error = error.message;
		}
	} catch (error: any) {
		results.github.error = error.message;
		results.vercel.error = error.message;
	}

	return results;
}

/**
 * Get available template repositories
 */
export async function getTemplateRepositories(
	githubToken: string,
	organization?: string
): Promise<{
	success: boolean;
	repositories: Array<{
		id: number;
		name: string;
		fullName: string;
		description: string | null;
		htmlUrl: string;
		isPrivate: boolean;
		updatedAt: string;
		topics: string[];
	}>;
	error?: string;
}> {
	try {
		const githubService = createGitHubTemplateService(githubToken);
		const result = await githubService.listTemplateRepositories(organization);

		return {
			success: result.success,
			repositories: result.repositories.map((repo) => ({
				...repo,
				topics: repo.topics || [],
			})),
			error: result.error,
		};
	} catch (error: any) {
		return {
			success: false,
			repositories: [],
			error: error.message || "Failed to fetch template repositories",
		};
	}
}

/**
 * Generate suggested project names based on repository name
 */
export async function generateProjectNameSuggestions(repoName: string): Promise<string[]> {
	const sanitized = repoName.toLowerCase().replace(/[^a-z0-9]/g, "-");
	const suggestions = [
		sanitized,
		`${sanitized}-app`,
		`${sanitized}-web`,
		`${sanitized}-site`,
		`my-${sanitized}`,
	];

	// Remove duplicates and invalid names
	return [...new Set(suggestions)].filter(
		(name) =>
			name.length <= 52 &&
			/^[a-z0-9-]+$/.test(name) &&
			!name.startsWith("-") &&
			!name.endsWith("-") &&
			!name.includes("--")
	);
}

/**
 * Get deployment status by checking both GitHub and Vercel
 */
export async function getDeploymentStatus(githubRepo: string, vercelProjectId: string) {
	const session = await auth();

	// Handle NextResponse type from auth function when redirecting
	if (!session || (typeof session === "object" && "status" in session)) {
		return {
			success: false,
			error: "Authentication required",
		};
	}

	if (!session.user?.id) {
		return {
			success: false,
			error: "Authentication required",
		};
	}

	// Get user's Vercel token
	const vercelToken = await getVercelAccessToken(session.user.id);

	if (!vercelToken) {
		return {
			success: false,
			error: "Vercel account not connected",
		};
	}

	try {
		const vercelService = createVercelAPIService(vercelToken);

		// Get latest deployment status
		const deployments = await vercelService.getDeployments(vercelProjectId, 1);

		if (!deployments.length) {
			return {
				success: true,
				status: "pending",
				message: "No deployments found",
			};
		}

		const latestDeployment = deployments[0];

		return {
			success: true,
			status: latestDeployment.state.toLowerCase(),
			url: latestDeployment.url,
			createdAt: latestDeployment.createdAt,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to get deployment status",
		};
	}
}
