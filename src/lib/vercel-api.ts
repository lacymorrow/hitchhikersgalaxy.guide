/**
 * Vercel API Integration Service
 * Handles automated project creation and deployment configuration
 */

export interface VercelConfig {
	accessToken: string;
	teamId?: string;
}

export interface VercelProjectConfig {
	name: string;
	gitRepository: {
		type: "github" | "gitlab" | "bitbucket";
		repo: string; // e.g., "username/repo-name"
	};
	framework?: string;
	buildCommand?: string;
	outputDirectory?: string;
	installCommand?: string;
	devCommand?: string;
	environmentVariables?: {
		key: string;
		value: string;
		target: readonly ("production" | "preview" | "development")[];
	}[];
	domains?: string[];
}

export interface VercelProjectResult {
	success: boolean;
	projectId?: string;
	projectUrl?: string;
	deploymentUrl?: string;
	error?: string;
	details?: any;
}

export interface VercelDeploymentResult {
	success: boolean;
	deploymentId?: string;
	deploymentUrl?: string;
	error?: string;
	details?: any;
}

export class VercelAPIService {
	private baseUrl = "https://api.vercel.com";
	private accessToken: string;
	private teamId?: string;

	constructor(config: VercelConfig) {
		this.accessToken = config.accessToken;
		this.teamId = config.teamId;
	}

	/**
	 * Create a new Vercel project from a Git repository
	 */
	async createProject(config: VercelProjectConfig): Promise<VercelProjectResult> {
		try {
			console.log(`Creating Vercel project: ${config.name}`);

			const projectData = {
				name: config.name,
				gitRepository: {
					type: config.gitRepository.type,
					repo: config.gitRepository.repo,
				},
				framework: this.detectFramework(config.framework),
				buildCommand: config.buildCommand,
				outputDirectory: config.outputDirectory,
				installCommand: config.installCommand,
				devCommand: config.devCommand,
				environmentVariables: config.environmentVariables?.map((env) => ({
					key: env.key,
					value: env.value,
					type: "encrypted" as const,
					target: env.target,
				})),
			};

			const response = await this.makeRequest("/v10/projects", {
				method: "POST",
				body: JSON.stringify(projectData),
			});

			console.log(`Successfully created Vercel project: ${response.name}`);

			// If domains are specified, add them to the project
			if (config.domains && config.domains.length > 0) {
				await this.addDomains(response.id, config.domains);
			}

			return {
				success: true,
				projectId: response.id,
				projectUrl: `https://vercel.com/${response.accountId}/${response.name}`,
				details: response,
			};
		} catch (error: any) {
			console.error("Failed to create Vercel project:", error);

			return {
				success: false,
				error: this.formatErrorMessage(error),
				details: error.response?.data,
			};
		}
	}

	/**
	 * Trigger a new deployment for a project
	 */
	async createDeployment(projectId: string, gitRef?: string): Promise<VercelDeploymentResult> {
		try {
			console.log(`Creating deployment for project: ${projectId}`);

			const deploymentData = {
				name: projectId,
				gitSource: gitRef
					? {
						type: "github" as const,
						ref: gitRef,
					}
					: undefined,
				target: "production" as const,
			};

			const response = await this.makeRequest("/v13/deployments", {
				method: "POST",
				body: JSON.stringify(deploymentData),
			});

			console.log(`Successfully created deployment: ${response.url}`);

			return {
				success: true,
				deploymentId: response.id,
				deploymentUrl: response.url,
				details: response,
			};
		} catch (error: any) {
			console.error("Failed to create deployment:", error);

			return {
				success: false,
				error: this.formatErrorMessage(error),
				details: error.response?.data,
			};
		}
	}

	/**
	 * Get project information
	 */
	async getProject(projectId: string) {
		try {
			const response = await this.makeRequest(`/v10/projects/${projectId}`);

			return {
				success: true,
				data: response,
			};
		} catch (error: any) {
			return {
				success: false,
				error: this.formatErrorMessage(error),
			};
		}
	}

	/**
	 * Update project configuration
	 */
	async updateProject(projectId: string, updates: Partial<VercelProjectConfig>) {
		try {
			const updateData = {
				framework: updates.framework,
				buildCommand: updates.buildCommand,
				outputDirectory: updates.outputDirectory,
				installCommand: updates.installCommand,
				devCommand: updates.devCommand,
			};

			const response = await this.makeRequest(`/v10/projects/${projectId}`, {
				method: "PATCH",
				body: JSON.stringify(updateData),
			});

			return {
				success: true,
				data: response,
			};
		} catch (error: any) {
			return {
				success: false,
				error: this.formatErrorMessage(error),
			};
		}
	}

	/**
	 * Add environment variables to a project
	 */
	async addEnvironmentVariables(
		projectId: string,
		variables: {
			key: string;
			value: string;
			target: ("production" | "preview" | "development")[];
		}[]
	) {
		try {
			const results = [];

			for (const variable of variables) {
				try {
					const response = await this.makeRequest(`/v10/projects/${projectId}/env`, {
						method: "POST",
						body: JSON.stringify({
							key: variable.key,
							value: variable.value,
							type: "encrypted",
							target: variable.target,
						}),
					});

					results.push({
						key: variable.key,
						success: true,
						id: response.id,
					});
				} catch (error: any) {
					results.push({
						key: variable.key,
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
	 * Add domains to a project
	 */
	async addDomains(projectId: string, domains: string[]) {
		try {
			const results = [];

			for (const domain of domains) {
				try {
					const response = await this.makeRequest(`/v10/projects/${projectId}/domains`, {
						method: "POST",
						body: JSON.stringify({
							name: domain,
						}),
					});

					results.push({
						domain,
						success: true,
						details: response,
					});
				} catch (error: any) {
					results.push({
						domain,
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
	 * Get deployment status
	 */
	async getDeploymentStatus(deploymentId: string) {
		try {
			const response = await this.makeRequest(`/v13/deployments/${deploymentId}`);

			return {
				success: true,
				status: response.readyState,
				url: response.url,
				details: response,
			};
		} catch (error: any) {
			return {
				success: false,
				error: this.formatErrorMessage(error),
			};
		}
	}

	/**
	 * List user's projects
	 */
	async listProjects() {
		try {
			const response = await this.makeRequest("/v10/projects");

			return {
				success: true,
				projects: response.projects.map((project: any) => ({
					id: project.id,
					name: project.name,
					framework: project.framework,
					createdAt: project.createdAt,
					updatedAt: project.updatedAt,
					targets: project.targets,
				})),
			};
		} catch (error: any) {
			return {
				success: false,
				error: this.formatErrorMessage(error),
				projects: [],
			};
		}
	}

	/**
	 * Check if project name is available
	 */
	async isProjectNameAvailable(name: string): Promise<boolean> {
		try {
			const projects = await this.listProjects();
			if (!projects.success) return false;

			return !projects.projects.some(
				(project: any) => project.name.toLowerCase() === name.toLowerCase()
			);
		} catch (error) {
			return false;
		}
	}

	/**
	 * Get deployments for a project
	 */
	async getDeployments(projectId: string, limit = 10) {
		try {
			const response = await this.makeRequest(
				`/v6/deployments?projectId=${projectId}&limit=${limit}`
			);

			return response.deployments ?? [];
		} catch (error: any) {
			console.error("Failed to get deployments:", error);
			return [];
		}
	}

	/**
	 * Make authenticated request to Vercel API
	 */
	private async makeRequest(endpoint: string, options: RequestInit = {}) {
		const url = new URL(`${this.baseUrl}${endpoint}`);
		if (this.teamId) {
			url.searchParams.append("teamId", this.teamId);
		}

		const response = await fetch(url.toString(), {
			...options,
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				"Content-Type": "application/json",
				...options.headers,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const error = new Error(`Vercel API error: ${response.status} ${response.statusText}`);
			(error as any).status = response.status;
			(error as any).response = { data: errorData };
			throw error;
		}

		return response.json();
	}

	/**
	 * Detect framework based on repository structure or explicit configuration
	 */
	private detectFramework(explicitFramework?: string): string | undefined {
		if (explicitFramework) {
			return explicitFramework;
		}

		// For Shipkit, we know it's Next.js
		return "nextjs";
	}

	/**
	 * Format error messages for user-friendly display
	 */
	private formatErrorMessage(error: any): string {
		if (error.status === 401) {
			return "Vercel authentication failed. Please check your access token.";
		}
		if (error.status === 403) {
			return "Insufficient permissions for Vercel operation.";
		}
		if (error.status === 404) {
			return "Vercel project or resource not found.";
		}
		if (error.status === 409) {
			return "A project with this name already exists.";
		}
		if (error.status === 422) {
			return error.response?.data?.error?.message ?? "Invalid project configuration.";
		}
		if (error.status === 429) {
			return "Vercel API rate limit exceeded. Please try again later.";
		}

		return error.message ?? "An unexpected error occurred with Vercel API.";
	}
}

/**
 * Create a Vercel API service instance
 */
export function createVercelAPIService(accessToken: string, teamId?: string): VercelAPIService {
	return new VercelAPIService({ accessToken, teamId });
}

/**
 * Validate Vercel project name
 */
export function validateVercelProjectName(name: string): { valid: boolean; error?: string } {
	if (!name || name.length === 0) {
		return { valid: false, error: "Project name cannot be empty" };
	}

	if (name.length > 52) {
		return { valid: false, error: "Project name cannot exceed 52 characters" };
	}

	// Must contain only lowercase letters, numbers, and hyphens
	if (!/^[a-z0-9-]+$/.test(name)) {
		return {
			valid: false,
			error: "Project name can only contain lowercase letters, numbers, and hyphens",
		};
	}

	// Cannot start or end with hyphens
	if (name.startsWith("-") || name.endsWith("-")) {
		return { valid: false, error: "Project name cannot start or end with hyphens" };
	}

	// Cannot contain consecutive hyphens
	if (name.includes("--")) {
		return { valid: false, error: "Project name cannot contain consecutive hyphens" };
	}

	return { valid: true };
}

/**
 * Common environment variables for Next.js projects
 */
export const COMMON_ENV_VARIABLES = {
	nextjs: [
		{ key: "NODE_ENV", value: "production", target: ["production"] as const },
		{ key: "NEXTAUTH_URL", value: "", target: ["production", "preview"] as const },
		{ key: "NEXTAUTH_SECRET", value: "", target: ["production", "preview"] as const },
	],
	shipkit: [
		{ key: "DATABASE_URL", value: "", target: ["production", "preview"] as const },
		{ key: "NEXTAUTH_URL", value: "", target: ["production", "preview"] as const },
		{ key: "NEXTAUTH_SECRET", value: "", target: ["production", "preview"] as const },
		{ key: "STRIPE_SECRET_KEY", value: "", target: ["production"] as const },
		{ key: "STRIPE_WEBHOOK_SECRET", value: "", target: ["production"] as const },
	],
} as const;
