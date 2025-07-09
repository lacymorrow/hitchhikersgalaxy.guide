#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createShipKitApp } from "./create-app.js";
import type { CreateAppOptions } from "./types.js";
import { validateProjectName } from "./utils/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json for version info
const packageJsonPath = path.join(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as { version: string };

interface CommanderOptions {
	template: string;
	features?: string;
	pm: string;
	skipInstall?: boolean;
	skipGit?: boolean;
	yes?: boolean;
	verbose?: boolean;
}

const program = new Command();

program
	.name("create-shipkit-app")
	.description("Create a new ShipKit application")
	.version(packageJson.version)
	.argument("[project-name]", "Name of the project")
	.option("-t, --template <template>", "Template to use (minimal, full)", "full")
	.option("--features <features>", "Comma-separated list of features to include")
	.option("--pm <package-manager>", "Package manager to use (npm, pnpm, yarn)", "pnpm")
	.option("--skip-install", "Skip dependency installation")
	.option("--skip-git", "Skip git initialization")
	.option("-y, --yes", "Skip interactive prompts and use defaults")
	.option("--verbose", "Enable verbose logging")
	.action(async (projectName: string | undefined, options: CommanderOptions) => {
		try {
			console.log(chalk.blue.bold(`🚀 Create ShipKit App v${packageJson.version}\n`));

			// Validate project name if provided
			if (projectName) {
				const validation = validateProjectName(projectName);
				if (!validation.isValid) {
					console.error(chalk.red(`Error: ${validation.message}`));
					process.exit(1);
				}
			}

			const createAppOptions: CreateAppOptions = {
				projectName,
				template: options.template,
				features: options.features?.split(",") ?? [],
				packageManager: options.pm as CreateAppOptions["packageManager"],
				skipInstall: options.skipInstall ?? false,
				skipGit: options.skipGit ?? false,
				useDefaults: options.yes ?? false,
				verbose: options.verbose ?? false,
			};

			await createShipKitApp(createAppOptions);
		} catch (error) {
			console.error(chalk.red("\n❌ An error occurred:"));
			if (error instanceof Error) {
				console.error(chalk.red(error.message));
				if (options.verbose) {
					console.error(chalk.gray(error.stack));
				}
			} else {
				console.error(chalk.red("Unknown error occurred"));
			}
			process.exit(1);
		}
	});

program.parse(process.argv);
