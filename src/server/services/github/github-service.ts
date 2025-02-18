import { siteConfig } from "@/config/site";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { Octokit } from "@octokit/rest";
import { eq } from "drizzle-orm";
import { cache } from "react";

// Ensure token exists
if (!env?.GITHUB_ACCESS_TOKEN) {
	logger.error("GITHUB_ACCESS_TOKEN is required");
}

// Create an Octokit instance with the admin token
export const octokit = new Octokit({
	auth: env.GITHUB_ACCESS_TOKEN,
});

logger.info("Initialized GitHub service with admin token", {
	hasToken: true,
	repoOwner: siteConfig.repo.owner,
	repoName: siteConfig.repo.name,
});

interface GitHubAccessParams {
	githubUsername: string;
}

// Cache for 5 minutes
export const getRepo = cache(async (owner?: string, repo?: string) => {
	try {
		// Use provided values or fall back to siteConfig defaults
		const repoOwner = owner || siteConfig.repo.owner;
		const repoName = repo || siteConfig.repo.name;

		const response = await octokit.rest.repos.get({
			owner: repoOwner,
			repo: repoName,
		});

		return response.data;
	} catch (error) {
		logger.error("Error fetching GitHub stars:", error);
		return null;
	}
});

/**
 * Grants access to the private repository for a GitHub user
 */
export async function grantGitHubAccess({ githubUsername }: GitHubAccessParams) {
	logger.info("Starting GitHub access grant", {
		githubUsername,
	});

	if (!env?.GITHUB_ACCESS_TOKEN) {
		logger.warn("GitHub access token missing");
		return;
	}

	if (!githubUsername) {
		logger.error("GitHub username missing");
		throw new Error("GitHub username is required");
	}

	try {
		// Verify admin token first
		// try {
		// 	const { data: adminUser } = await octokit.rest.users.getAuthenticated();
		// 	const scopes = await getTokenScopes(env.GITHUB_ACCESS_TOKEN);

		// 	logger.info("Admin token verified", {
		// 		adminUsername: adminUser.login,
		// 		scopes,
		// 		hasRepoScope: scopes.includes("repo"),
		// 	});

		// 	if (!scopes.includes("repo")) {
		// 		throw new Error("Admin token missing 'repo' scope");
		// 	}
		// } catch (error) {
		// 	logger.error("Admin token verification failed", {
		// 		error,
		// 		errorMessage: error instanceof Error ? error.message : "Unknown error",
		// 	});
		// 	throw new Error("Invalid admin token configuration");
		// }

		// Check if user already has access using admin token
		logger.info("Checking existing repository access", {
			githubUsername,
			repository: `${siteConfig.repo.owner}/${siteConfig.repo.name}`,
		});

		try {
			const { data: collaborator } = await octokit.rest.repos.getCollaboratorPermissionLevel({
				owner: siteConfig.repo.owner,
				repo: siteConfig.repo.name,
				username: githubUsername,
			});

			logger.info("Retrieved collaborator permission level", {
				githubUsername,
				permission: collaborator.permission,
			});

			if (
				collaborator.permission === "admin" ||
				collaborator.permission === "write" ||
				collaborator.permission === "read"
			) {
				logger.info("User already has repository access", {
					githubUsername,
					permission: collaborator.permission,
				});
				return true;
			}
		} catch (error) {
			// 404 is expected if user is not a collaborator yet
			if (error instanceof Error && !error.message.includes("Not Found")) {
				throw error;
			}
			logger.info("User is not a collaborator yet", { githubUsername });
		}

		// Verify user token has correct scopes
		// const userScopes = await getTokenScopes(accessToken);
		// logger.info("Verifying user token", {
		// 	githubUsername,
		// 	scopes: userScopes,
		// 	hasRepoScope: userScopes.includes("repo"),
		// });

		// if (!userScopes.includes("repo")) {
		// 	throw new Error("User token missing 'repo' scope");
		// }

		// const userOctokit = new Octokit({
		// 	auth: accessToken,
		// });

		// const { data: user } = await userOctokit.rest.users.getAuthenticated();

		// logger.info("User token verified", {
		// 	providedUsername: githubUsername,
		// 	authenticatedUsername: user.login,
		// });

		const payload = {
			owner: siteConfig.repo.owner,
			repo: siteConfig.repo.name,
			username: githubUsername,
			permission: "read",
		};

		// Add user as collaborator with write access using admin token
		logger.info("Adding user as repository collaborator", payload);

		await octokit.rest.repos.addCollaborator(payload);

		logger.info("Successfully added user as repository collaborator", payload);

		return true;
	} catch (error) {
		logger.error("Error granting GitHub access", {
			error,
			githubUsername,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
			errorStack: error instanceof Error ? error.stack : undefined,
		});
		throw error;
	}
}

/**
 * Revokes GitHub access for a user, with safeguards to prevent dangerous operations
 */
export async function revokeGitHubAccess(userId: string) {
	try {
		// Get user details including their GitHub token and username
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				id: true,
				githubUsername: true,
				email: true,
			},
		});

		if (!user?.githubUsername) {
			logger.warn("No GitHub username found for user", { userId });
			return;
		}

		if (siteConfig.repo.owner === user.githubUsername) {
			// Update user record
			await db
				?.update(users)
				.set({
					githubUsername: null,
					updatedAt: new Date(),
				})
				.where(eq(users.id, userId));
			return true;
		}

		// Check if user has active deployments or critical operations
		const hasActiveDeployments = await checkActiveDeployments(user.githubUsername);
		if (hasActiveDeployments) {
			throw new Error("Cannot revoke access while user has active deployments");
		}

		logger.info("Removing user as collaborator", {
			owner: siteConfig.repo.owner,
			repo: siteConfig.repo.name,
			username: user.githubUsername,
		});

		try {
			// Remove user as collaborator using admin token
			const response = await octokit.rest.repos.removeCollaborator({
				owner: siteConfig.repo.owner,
				repo: siteConfig.repo.name,
				username: user.githubUsername,
			});

			if (response.status !== 204) {
				throw new Error(`Failed to remove collaborator: ${response.status}`);
			}

			logger.info("Successfully removed user as collaborator", {
				status: response.status,
				username: user.githubUsername,
			});

			// Update user record
			await db
				?.update(users)
				.set({
					githubUsername: null,
					updatedAt: new Date(),
				})
				.where(eq(users.id, userId));

			logger.info("Successfully revoked GitHub access", {
				userId,
				githubUsername: user.githubUsername,
			});
		} catch (removeError) {
			logger.error("Failed to remove GitHub collaborator", {
				error: removeError instanceof Error ? removeError.message : "Unknown error",
				username: user.githubUsername,
			});
			throw removeError;
		}
	} catch (error) {
		logger.error("Failed to revoke GitHub access", {
			userId,
			error: error instanceof Error ? error.message : "Unknown error",
		});
		throw error;
	}
}

/**
 * Checks if a GitHub user has any active deployments or critical operations
 */
async function checkActiveDeployments(githubUsername: string): Promise<boolean> {
	if (!env?.GITHUB_ACCESS_TOKEN) {
		logger.warn("GITHUB_ACCESS_TOKEN is not set in the environment.");
		return false;
	}

	try {
		const octokit = new Octokit({
			auth: env.GITHUB_ACCESS_TOKEN,
		});

		// Check deployments
		const { data: deployments } = await octokit.rest.repos.listDeployments({
			owner: siteConfig.repo.owner,
			repo: siteConfig.repo.name,
			per_page: 100,
		});

		const activeDeployments = deployments.filter(
			(deployment: any) => deployment.creator?.login === githubUsername
		);

		return activeDeployments.length > 0;
	} catch (error) {
		logger.error("Failed to check active deployments", {
			githubUsername,
			error: error instanceof Error ? error.message : "Unknown error",
		});
		return false;
	}
}

/**
 * Get OAuth token scopes
 */
async function getTokenScopes(token: string): Promise<string[]> {
	try {
		const tempOctokit = new Octokit({ auth: token });
		const { headers } = await tempOctokit.request("GET /user");
		return headers["x-oauth-scopes"]?.split(", ") ?? [];
	} catch (error) {
		logger.error("Error getting token scopes", { error });
		return [];
	}
}

/**
 * Check if a GitHub username exists
 */
export async function checkGitHubUsername(username: string): Promise<boolean> {
	logger.info("Checking if GitHub username exists", { username });

	try {
		await octokit.rest.users.getByUsername({
			username,
		});
		logger.info("GitHub username exists", { username });
		return true;
	} catch (error) {
		logger.error("Error checking GitHub username", {
			error,
			username,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
		});
		return false;
	}
}

/**
 * Check if a user has connected their GitHub account
 */
export async function checkGitHubConnection(userId: string): Promise<boolean> {
	logger.info("Checking GitHub connection", { userId });

	const user = await db
		?.select()
		.from(users)
		.where(eq(users.id, userId))
		.then((rows: any) => rows[0]);

	const hasGitHubConnection = Boolean(user?.githubUsername);

	logger.info("GitHub connection status", {
		userId,
		hasGitHubConnection,
		githubUsername: user?.githubUsername,
	});

	return hasGitHubConnection;
}

// Cache the star count for 5 minutes to avoid hitting GitHub's rate limits
export const getRepoStars = cache(
	async ({
		owner = siteConfig.repo.owner,
		repo = siteConfig.repo.name,
	}: { owner?: string; repo?: string } = {}) => {
		try {
			const response = await getRepo(owner, repo);
			return response?.stargazers_count ?? 0;
		} catch (error) {
			logger.error("Error fetching GitHub stars:", error);
			return 0;
		}
	}
);

/**
 * Verify and store a GitHub username for a user
 * This is a simplified version that just verifies the username exists and stores it
 */
export async function verifyAndStoreGitHubUsername(
	userId: string,
	username: string
): Promise<boolean> {
	logger.info("Verifying and storing GitHub username", { userId, username });

	try {
		// First verify the username exists on GitHub
		const exists = await checkGitHubUsername(username);
		if (!exists) {
			logger.error("GitHub username does not exist", { username });
			throw new Error("GitHub username does not exist");
		}

		await grantGitHubAccess({ githubUsername: username });

		// Update the user record with the GitHub username
		await db
			?.update(users)
			.set({
				githubUsername: username,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		logger.info("Successfully stored GitHub username", { userId, username });
		return true;
	} catch (error) {
		logger.error("Error verifying and storing GitHub username", {
			error,
			userId,
			username,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
		});
		throw error;
	}
}

/**
 * Gets detailed information about repository collaborators
 */
export async function getCollaboratorDetails(username: string) {
	try {
		// Get collaborator permission level
		const { data: collaborator } = await octokit.rest.repos.getCollaboratorPermissionLevel({
			owner: siteConfig.repo.owner,
			repo: siteConfig.repo.name,
			username,
		});

		// Get user profile information
		const { data: profile } = await octokit.rest.users.getByUsername({
			username,
		});

		return {
			...profile,
			permission: collaborator.permission,
		};
	} catch (error) {
		logger.error("Error fetching collaborator details:", error);
		return null;
	}
}
