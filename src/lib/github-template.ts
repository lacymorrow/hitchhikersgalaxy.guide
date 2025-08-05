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

			// Add upstream information to the repository description or topics
			await this.addUpstreamInfo({
				owner: config.newRepoOwner,
				repo: config.newRepoName,
				upstreamOwner: config.templateOwner,
				upstreamRepo: config.templateRepo,
			});

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
	 * Add upstream information to repository
	 * This helps users track the original template source
	 */
	private async addUpstreamInfo(config: {
		owner: string;
		repo: string;
		upstreamOwner: string;
		upstreamRepo: string;
	}) {
		try {
			// Update repository with upstream info in topics
			await this.octokit.repos.replaceAllTopics({
				owner: config.owner,
				repo: config.repo,
				names: [
					"shipkit",
					`upstream-${config.upstreamOwner}-${config.upstreamRepo}`
						.toLowerCase()
						.replace(/[^a-z0-9-]/g, "-"),
				],
			});

			// Create or update a file with sync instructions
			const syncInstructions = `# Syncing with Upstream

This repository was created from the template: [${config.upstreamOwner}/${config.upstreamRepo}](https://github.com/${config.upstreamOwner}/${config.upstreamRepo})

## Quick Sync (Recommended)

Use this button to sync with the latest changes from the upstream repository:

[![Sync with Upstream](https://img.shields.io/badge/Sync%20with-Upstream-blue?style=for-the-badge&logo=github)](https://github.com/${config.owner}/${config.repo}/compare/main...${config.upstreamOwner}:${config.upstreamRepo}:main)

## Manual Sync Instructions

### Option 1: Using Git Commands

1. Add the upstream remote (one time setup):
\`\`\`bash
git remote add upstream https://github.com/${config.upstreamOwner}/${config.upstreamRepo}.git
\`\`\`

2. Fetch upstream changes:
\`\`\`bash
git fetch upstream
\`\`\`

3. Merge upstream changes into your main branch:
\`\`\`bash
git checkout main
git merge upstream/main
\`\`\`

4. Resolve any conflicts and push:
\`\`\`bash
git push origin main
\`\`\`

### Option 2: Using GitHub CLI

\`\`\`bash
gh repo sync ${config.owner}/${config.repo} --source ${config.upstreamOwner}/${config.upstreamRepo}
\`\`\`

### Option 3: Create a Pull Request

You can also create a pull request from the upstream repository to your fork:

1. Go to your repository on GitHub
2. Click "Compare" or go to: https://github.com/${config.owner}/${config.repo}/compare/main...${config.upstreamOwner}:${config.upstreamRepo}:main
3. Review the changes and create a pull request
4. Merge the pull request

## Automated Sync

To automatically keep your repository in sync, you can set up a GitHub Action. Create \`.github/workflows/sync-upstream.yml\`:

\`\`\`yaml
name: Sync with Upstream

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
  workflow_dispatch: # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Sync upstream changes
        run: |
          git remote add upstream https://github.com/${config.upstreamOwner}/${config.upstreamRepo}.git
          git fetch upstream
          git checkout main
          git merge upstream/main --no-edit
          git push origin main
\`\`\`

For more information, see the [GitHub documentation on syncing a fork](https://docs.github.com/en/github/collaborating-with-pull-requests/working-with-forks/syncing-a-fork).
`;

			try {
				await this.octokit.repos.createOrUpdateFileContents({
					owner: config.owner,
					repo: config.repo,
					path: "SYNC_UPSTREAM.md",
					message: "Add upstream sync instructions",
					content: Buffer.from(syncInstructions).toString("base64"),
				});
			} catch (error) {
				console.warn("Could not create SYNC_UPSTREAM.md file:", error);
				// Don't fail the whole operation if this fails
			}
		} catch (error) {
			console.warn("Could not add upstream info to repository:", error);
			// Don't fail the whole operation if this fails
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
