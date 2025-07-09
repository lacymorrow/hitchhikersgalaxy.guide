import chalk from "chalk";
import { execa } from "execa";
import type { CreateAppOptions } from "../types.js";

/**
 * Install dependencies using the specified package manager
 */
export async function installDependencies(
	projectPath: string,
	packageManager: CreateAppOptions["packageManager"]
): Promise<void> {
	const commands = {
		npm: ["npm", ["install"]],
		pnpm: ["pnpm", ["install"]],
		yarn: ["yarn", ["install"]],
	} as const;

	const [command, args] = commands[packageManager];

	try {
		await execa(command, args, {
			cwd: projectPath,
			stdio: "inherit",
		});
	} catch (error) {
		throw new Error(
			`Failed to install dependencies with ${packageManager}. ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Check if a package manager is available
 */
export async function checkPackageManager(
	packageManager: CreateAppOptions["packageManager"]
): Promise<boolean> {
	try {
		await execa(packageManager, ["--version"], {
			stdio: "ignore",
		});
		return true;
	} catch {
		return false;
	}
}

/**
 * Get the best available package manager
 */
export async function getBestPackageManager(): Promise<CreateAppOptions["packageManager"]> {
	const managers: CreateAppOptions["packageManager"][] = ["pnpm", "yarn", "npm"];

	for (const manager of managers) {
		if (await checkPackageManager(manager)) {
			return manager;
		}
	}

	return "npm"; // Fallback to npm (should always be available with Node.js)
}

/**
 * Get the installation command for a package manager
 */
export function getInstallCommand(packageManager: CreateAppOptions["packageManager"]): string {
	const commands = {
		npm: "npm install",
		pnpm: "pnpm install",
		yarn: "yarn install",
	};

	return commands[packageManager];
}

/**
 * Get the dev server command for a package manager
 */
export function getDevCommand(packageManager: CreateAppOptions["packageManager"]): string {
	const commands = {
		npm: "npm run dev",
		pnpm: "pnpm dev",
		yarn: "yarn dev",
	};

	return commands[packageManager];
}
