"use server";

import { createGitHubTemplateService } from "@/lib/github-template";
import { createVercelAPIService } from "@/lib/vercel-api";
import { createDeployment, updateDeployment } from "@/server/actions/deployment-actions";
import { auth } from "@/server/auth";
import { getGitHubAccessToken } from "@/server/services/github/github-token-service";
import { getVercelAccessToken } from "@/server/services/vercel/vercel-service";

/**
 * Server actions for private repository deployment
 */

// Define a common type for environment variable targets
type EnvVarTarget = readonly ("production" | "preview" | "development")[];

export interface DeploymentConfig {
	templateRepo: string; // e.g., "shipkit/private-template"
	newRepoName: string;
	projectName: string;
	description?: string;
	environmentVariables?: {
		key: string;
		value: string;
		target: EnvVarTarget;
	}[];
	domains?: string[];
	includeAllBranches?: boolean;
	githubToken?: string; // Optional - will use OAuth token if not provided
	deploymentId?: string; // Optional - for tracking deployment status
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
		details?: unknown;
		requiresManualImport?: boolean;
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

	// Get user's GitHub token - prefer OAuth token over provided token
	const {
		templateRepo,
		projectName,
		description,
		environmentVariables = [],
		githubToken: providedGithubToken,
		deploymentId,
	} = config;

	// Try to get GitHub token from OAuth connection first
	let githubToken = await getGitHubAccessToken(session.user.id);

	// Fall back to provided token if OAuth token not available
	if (!githubToken && providedGithubToken) {
		githubToken = providedGithubToken;
	}

	if (!githubToken) {
		return {
			success: false,
			error:
				"GitHub account not connected. Please connect your GitHub account first or provide an access token.",
		};
	}

	// Get user's Vercel access token using the service
	const vercelToken = await getVercelAccessToken(session.user.id);

	if (!vercelToken) {
		return {
			success: false,
			error: "Vercel account not connected. Please connect your Vercel account in Settings first.",
		};
	}

	let currentDeploymentId = deploymentId;

	try {
		// If no deploymentId is provided, create a new deployment record
		if (!currentDeploymentId) {
			const newDeployment = await createDeployment({
				projectName,
				description: description || `Deployment of ${projectName}`,
				status: "deploying",
			});
			currentDeploymentId = newDeployment.id;
		}

		// Validate configuration
		const validation = await validateDeploymentConfig({
			templateRepo,
			projectName,
			githubToken,
			vercelToken,
		});

		if (!validation.success) {
			const error = validation.error || "Configuration validation failed";
			if (currentDeploymentId) {
				await updateDeployment(currentDeploymentId, { status: "failed", error });
			}
			return {
				success: false,
				error,
			};
		}

		// Starting deployment

		// Parse templateRepo to get owner and repo name
		const [templateOwner, templateRepoName] = templateRepo.split("/");
		if (!templateOwner || !templateRepoName) {
			const error = "Template repository must be in format 'owner/repo-name'";
			if (currentDeploymentId) {
				await updateDeployment(currentDeploymentId, { status: "failed", error });
			}
			return {
				success: false,
				error,
			};
		}

		// Step 1: Create GitHub repository from template
		const githubService = createGitHubTemplateService(githubToken);

		// Get the authenticated GitHub user to get their username
		const userInfo = await githubService.getCurrentUserInfo();
		if (!userInfo.success || !userInfo.username) {
			const error =
				userInfo.error || "Failed to get GitHub user information. Please check your access token.";
			if (currentDeploymentId) {
				await updateDeployment(currentDeploymentId, { status: "failed", error });
			}
			return {
				success: false,
				error,
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
			const error = repoResult.error || "Failed to create GitHub repository";
			if (currentDeploymentId) {
				await updateDeployment(currentDeploymentId, { status: "failed", error });
			}
			return {
				success: false,
				error,
				data: {
					step: "github-repo-creation",
					details: repoResult.error,
				},
			};
		}

		// GitHub repository created successfully

		// Extract repo info from the result
		const repoInfo = {
			url: repoResult.repoUrl ?? '',
			name: projectName,
			cloneUrl: repoResult.details?.cloneUrl ?? repoResult.repoUrl ?? '',
		};

		// Update deployment record with GitHub info
		if (currentDeploymentId) {
			await updateDeployment(currentDeploymentId, {
				githubRepoUrl: repoInfo.url,
				githubRepoName: repoInfo.name,
			});
		}

		// Step 2: Create Vercel project
		const vercelService = createVercelAPIService(vercelToken);

		// First try to create project with git repository
		let projectResult = await vercelService.createProject({
			name: projectName,
			gitRepository: {
				type: "github" as const,
				repo: `${githubUsername}/${projectName}`,
			},
			framework: "nextjs",
			// Don't send empty environment variables initially
			environmentVariables: environmentVariables.length > 0 ? environmentVariables : undefined,
		});

		// If that fails, try creating without git repository (manual setup)
		if (!projectResult.success) {
			// Failed to create project with git repo, trying without...

			projectResult = await vercelService.createProject({
				name: projectName,
				framework: "nextjs",
				// Don't send empty environment variables initially
				environmentVariables: environmentVariables.length > 0 ? environmentVariables : undefined,
			});

			// If project creation succeeded without git, try to connect the repository
			if (projectResult.success && projectResult.projectId) {
				// Project created without git repo, attempting to connect repository
				const gitConnectResult = await vercelService.connectGitRepository(projectResult.projectId, {
					type: "github" as const,
					repo: `${githubUsername}/${projectName}`,
				});

				if (!gitConnectResult.success) {
					// Failed to connect git repository but continuing
					// Don't fail the deployment, just warn
				}
			}
		}

		if (!projectResult.success || !projectResult.projectId) {
			// If Vercel project creation failed but GitHub repo was created,
			// return a special response indicating manual import is needed
			const error =
				projectResult.error ??
				"Failed to create Vercel project. You can manually import the repository.";
			if (currentDeploymentId) {
				await updateDeployment(currentDeploymentId, { status: "failed", error });
			}
			return {
				success: false,
				error,
				data: {
					step: "vercel-project-creation",
					details: projectResult.error,
					githubRepo: repoInfo,
					requiresManualImport: true,
				},
			};
		}

		// Vercel project created successfully

		// Step 3: Update deployment record with Vercel project info
		if (currentDeploymentId) {
			await updateDeployment(currentDeploymentId, {
				vercelProjectUrl: projectResult.projectUrl ?? '',
				vercelDeploymentUrl: `https://${projectName}.vercel.app`,
			});
		}

		// Step 4: Poll for actual deployment status in the background
		// This ensures we don't block the response but still update the status
		const pollDeploymentStatus = async () => {
			let attempts = 0;
			const maxAttempts = 20; // Poll for up to ~60 seconds
			
			while (attempts < maxAttempts) {
				attempts++;
				await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds between polls
				
				try {
					const projectInfo = await vercelService.getProject(projectResult.projectId ?? '');
					if (projectInfo.success && projectInfo.data?.latestDeployments?.[0]) {
						const latestDeployment = projectInfo.data.latestDeployments[0];
						
						// Check deployment state
						if (latestDeployment.state === "READY" || latestDeployment.state === "ERROR" || latestDeployment.state === "CANCELED") {
							const status = latestDeployment.state === "READY" ? "completed" : "failed";
							const deploymentUrl = latestDeployment.url ? `https://${latestDeployment.url}` : `https://${projectName}.vercel.app`;
							
							// Deployment status updated
							
							// Update deployment record with final status
							if (currentDeploymentId) {
								await updateDeployment(currentDeploymentId, {
									status,
									vercelDeploymentUrl: deploymentUrl,
									error: latestDeployment.state === "ERROR" ? "Vercel deployment failed" : undefined,
								});
							}
							break;
						}
					}
				} catch {
					// Poll attempt failed, will retry
				}
			}
			
			// If we exhausted all attempts, mark as completed anyway (Vercel will continue in background)
			if (attempts >= maxAttempts && currentDeploymentId) {
				// Polling timed out, marking as completed
				await updateDeployment(currentDeploymentId, {
					status: "completed",
				});
			}
		};

		// Start polling in the background
		pollDeploymentStatus().catch(() => {
			// Failed to poll deployment status
			if (currentDeploymentId) {
				updateDeployment(currentDeploymentId, {
					status: "completed", // Mark as completed even if polling fails
				}).catch(() => { /* ignore errors */ });
			}
		});

		// Return success - Vercel should automatically deploy the GitHub repo
		return {
			success: true,
			message: `Successfully created project ${projectName} on Vercel. The initial deployment will begin shortly.`,
			data: {
				githubRepo: repoInfo,
				vercelProject: {
					projectId: projectResult.projectId ?? '',
					projectUrl: projectResult.projectUrl ?? '',
					deploymentUrl: `https://${projectName}.vercel.app`,
				},
			},
		};
	} catch (error) {
		// Deployment failed

		const errorMessage = error instanceof Error ? error.message : "Unknown deployment error";

		if (currentDeploymentId) {
			await updateDeployment(currentDeploymentId, { status: "failed", error: errorMessage });
		}

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
export function validateDeploymentConfig(config: {
	templateRepo: string;
	projectName: string;
	githubToken?: string;
	vercelToken: string;
}): { success: boolean; error?: string } {
	const { templateRepo, projectName, vercelToken } = config;

	// Validate template repo format
	if (!templateRepo?.includes("/")) {
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

	// GitHub token is now optional - will be fetched from OAuth if not provided

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
		} catch (error) {
			results.github.error = error instanceof Error ? error.message : String(error);
		}

		// Check Vercel availability
		try {
			const vercelService = createVercelAPIService(vercelToken);
			results.vercel.available = await vercelService.isProjectNameAvailable(projectName);
		} catch (error) {
			results.vercel.error = error instanceof Error ? error.message : String(error);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		results.github.error = errorMessage;
		results.vercel.error = errorMessage;
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
	repositories: {
		id: number;
		name: string;
		fullName: string;
		description: string | null;
		htmlUrl: string;
		isPrivate: boolean;
		updatedAt: string;
		topics: string[];
	}[];
	error?: string;
}> {
	try {
		const githubService = createGitHubTemplateService(githubToken);
		const result = await githubService.listTemplateRepositories(organization);

		return {
			success: result.success,
			repositories: result.repositories.map((repo) => ({
				...repo,
				topics: repo.topics ?? [],
			})),
			error: result.error,
		};
	} catch (error) {
		return {
			success: false,
			repositories: [],
			error: error instanceof Error ? error.message : "Failed to fetch template repositories",
		};
	}
}

/**
 * Generate suggested project names based on repository name
 */
export function generateProjectNameSuggestions(repoName: string): string[] {
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
export async function getDeploymentStatus(_githubRepo: string, vercelProjectId: string) {
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
