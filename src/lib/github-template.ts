import { Octokit } from "@octokit/rest";

/**
 * GitHub Template Repository Service
 * Handles creation of repositories from private templates
 */

export interface GitHubConfig {
	accessToken: string;
	userAgent?: string;
}

export interface TemplateRepoConfig {
	templateOwner: string;
	templateRepo: string;
	newRepoName: string;
	newRepoOwner: string;
	description?: string;
	private?: boolean;
	includeAllBranches?: boolean;
}

export interface RepoCreationResult {
	success: boolean;
	repoUrl?: string;
	repoId?: number;
	error?: string;
	details?: any;
}

export class GitHubTemplateService {
	private octokit: Octokit;

	constructor(config: GitHubConfig) {
		this.octokit = new Octokit({
			auth: config.accessToken,
			userAgent: config.userAgent || "Shipkit-Deploy/1.0.0",
		});
	}

	/**
	 * Create a new repository from a template repository
	 */
	async createFromTemplate(config: TemplateRepoConfig): Promise<RepoCreationResult> {
		try {
			console.log(
				`Creating repository from template: ${config.templateOwner}/${config.templateRepo}`
			);

			// First, verify the template repository exists and is accessible
			await this.verifyTemplateAccess(config.templateOwner, config.templateRepo);

			// Create repository from template
			const response = await this.octokit.repos.createUsingTemplate({
				template_owner: config.templateOwner,
				template_repo: config.templateRepo,
				owner: config.newRepoOwner,
				name: config.newRepoName,
				description: config.description || `Deployed from ${config.templateRepo} template`,
				private: config.private ?? true,
				include_all_branches: config.includeAllBranches ?? false,
			});

			console.log(`Successfully created repository: ${response.data.html_url}`);

			return {
				success: true,
				repoUrl: response.data.html_url,
				repoId: response.data.id,
				details: {
					cloneUrl: response.data.clone_url,
					sshUrl: response.data.ssh_url,
					fullName: response.data.full_name,
					defaultBranch: response.data.default_branch,
				},
			};
		} catch (error: any) {
			console.error("Failed to create repository from template:", error);

			return {
				success: false,
				error: this.formatErrorMessage(error),
				details: error.response?.data,
			};
		}
	}

	/**
	 * Verify that the template repository exists and is accessible
	 */
	private async verifyTemplateAccess(owner: string, repo: string): Promise<void> {
		try {
			const response = await this.octokit.repos.get({
				owner,
				repo,
			});

			if (!response.data.is_template) {
				throw new Error(`Repository ${owner}/${repo} is not configured as a template repository`);
			}
		} catch (error: any) {
			if (error.status === 404) {
				throw new Error(`Template repository ${owner}/${repo} not found or not accessible`);
			}
			throw error;
		}
	}

	/**
	 * Get information about a repository
	 */
	async getRepositoryInfo(owner: string, repo: string) {
		try {
			const response = await this.octokit.repos.get({
				owner,
				repo,
			});

			return {
				success: true,
				data: {
					id: response.data.id,
					name: response.data.name,
					fullName: response.data.full_name,
					description: response.data.description,
					htmlUrl: response.data.html_url,
					cloneUrl: response.data.clone_url,
					sshUrl: response.data.ssh_url,
					defaultBranch: response.data.default_branch,
					isTemplate: response.data.is_template,
					isPrivate: response.data.private,
					topics: response.data.topics,
				},
			};
		} catch (error: any) {
			return {
				success: false,
				error: this.formatErrorMessage(error),
			};
		}
	}

	/**
	 * List available template repositories that the user has access to
	 */
	async listTemplateRepositories(org?: string) {
		try {
			const searchQuery = org
				? `org:${org} is:template`
				: `user:${await this.getCurrentUser()} is:template`;

			const response = await this.octokit.search.repos({
				q: searchQuery,
				sort: "updated",
				order: "desc",
				per_page: 50,
			});

			return {
				success: true,
				repositories: response.data.items.map((repo) => ({
					id: repo.id,
					name: repo.name,
					fullName: repo.full_name,
					description: repo.description,
					htmlUrl: repo.html_url,
					isPrivate: repo.private,
					updatedAt: repo.updated_at,
					topics: repo.topics,
				})),
			};
		} catch (error: any) {
			return {
				success: false,
				error: this.formatErrorMessage(error),
				repositories: [],
			};
		}
	}

	/**
	 * Get the current authenticated user
	 */
	private async getCurrentUser(): Promise<string> {
		const response = await this.octokit.users.getAuthenticated();
		return response.data.login;
	}

	/**
	 * Get the current authenticated user info
	 */
	async getCurrentUserInfo(): Promise<{ success: boolean; username?: string; error?: string }> {
		try {
			const username = await this.getCurrentUser();
			return {
				success: true,
				username,
			};
		} catch (error: any) {
			return {
				success: false,
				error: this.formatErrorMessage(error),
			};
		}
	}

	/**
	 * Check if a repository name is available for the user
	 */
	async isRepositoryNameAvailable(owner: string, repoName: string): Promise<boolean> {
		try {
			await this.octokit.repos.get({
				owner,
				repo: repoName,
			});
			return false; // Repository exists
		} catch (error: any) {
			if (error.status === 404) {
				return true; // Repository does not exist, name is available
			}
			throw error; // Some other error occurred
		}
	}

	/**
	 * Set up repository with initial configuration
	 */
	async configureRepository(
		owner: string,
		repo: string,
		config: {
			description?: string;
			topics?: string[];
			hasIssues?: boolean;
			hasProjects?: boolean;
			hasWiki?: boolean;
		}
	) {
		try {
			await this.octokit.repos.update({
				owner,
				repo,
				description: config.description,
				topics: config.topics,
				has_issues: config.hasIssues ?? true,
				has_projects: config.hasProjects ?? false,
				has_wiki: config.hasWiki ?? false,
			});

			return { success: true };
		} catch (error: any) {
			return {
				success: false,
				error: this.formatErrorMessage(error),
			};
		}
	}

	/**
	 * Add environment variables as repository secrets
	 */
	async addRepositorySecrets(owner: string, repo: string, secrets: Record<string, string>) {
		try {
			// Get the repository public key for encryption
			const { data: publicKey } = await this.octokit.actions.getRepoPublicKey({
				owner,
				repo,
			});

			const results = [];

			for (const [name, value] of Object.entries(secrets)) {
				try {
					// Note: In a real implementation, you'd need to encrypt the secret value
					// using the public key before sending it to GitHub
					await this.octokit.actions.createOrUpdateRepoSecret({
						owner,
						repo,
						secret_name: name,
						encrypted_value: value, // This should be encrypted
						key_id: publicKey.key_id,
					});

					results.push({ name, success: true });
				} catch (error: any) {
					results.push({
						name,
						success: false,
						error: this.formatErrorMessage(error),
					});
				}
			}

			return {
				success: true,
				results,
			};
		} catch (error: any) {
			return {
				success: false,
				error: this.formatErrorMessage(error),
			};
		}
	}

	/**
	 * Format error messages for user-friendly display
	 */
	private formatErrorMessage(error: any): string {
		if (error.status === 401) {
			return "GitHub authentication failed. Please check your access token.";
		}
		if (error.status === 403) {
			return "GitHub API rate limit exceeded or insufficient permissions.";
		}
		if (error.status === 404) {
			return "Repository not found or not accessible.";
		}
		if (error.status === 422) {
			return error.response?.data?.message || "Invalid repository configuration.";
		}

		return error.message || "An unexpected error occurred.";
	}
}

/**
 * Create a GitHub template service instance
 */
export function createGitHubTemplateService(accessToken: string): GitHubTemplateService {
	return new GitHubTemplateService({ accessToken });
}

/**
 * Utility function to validate repository name
 */
export function validateRepositoryName(name: string): { valid: boolean; error?: string } {
	// GitHub repository name validation rules
	if (!name || name.length === 0) {
		return { valid: false, error: "Repository name cannot be empty" };
	}

	if (name.length > 100) {
		return { valid: false, error: "Repository name cannot exceed 100 characters" };
	}

	// Must contain only alphanumeric characters, hyphens, underscores, and periods
	if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
		return {
			valid: false,
			error: "Repository name can only contain letters, numbers, hyphens, underscores, and periods",
		};
	}

	// Cannot start or end with special characters
	if (/^[._-]|[._-]$/.test(name)) {
		return { valid: false, error: "Repository name cannot start or end with special characters" };
	}

	return { valid: true };
}
