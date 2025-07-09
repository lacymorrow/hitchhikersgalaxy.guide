import chalk from "chalk";
import { execa } from "execa";
import fs from "fs-extra";
import inquirer from "inquirer";
import ora from "ora";
import path from "path";
import { getAvailableFeatures, getAvailableTemplates } from "./config/templates.js";
import { scaffoldProject } from "./scaffold/index.js";
import type { CreateAppOptions, ProjectConfig } from "./types.js";
import { initializeGit } from "./utils/git.js";
import { installDependencies } from "./utils/install.js";
import {
	validateProjectDirectory,
	validateProjectName,
	validateSystemRequirements,
} from "./utils/validation.js";

export async function createShipKitApp(options: CreateAppOptions): Promise<void> {
	// Validate system requirements
	const systemValidation = validateSystemRequirements();
	if (!systemValidation.isValid) {
		throw new Error(systemValidation.message);
	}

	// Get or prompt for project name
	let projectName = options.projectName;
	if (!projectName && !options.useDefaults) {
		const { name } = await inquirer.prompt([
			{
				type: "input",
				name: "name",
				message: "What is your project named?",
				default: "my-shipkit-app",
				validate: (input: string) => {
					const validation = validateProjectName(input);
					return validation.isValid || validation.message || false;
				},
			},
		]);
		projectName = name;
	} else if (!projectName) {
		projectName = "my-shipkit-app";
	}

	// At this point projectName is guaranteed to be defined
	if (!projectName) {
		throw new Error("Project name is required");
	}

	const projectPath = path.resolve(process.cwd(), projectName);

	// Validate project directory
	const dirValidation = await validateProjectDirectory(projectPath);
	if (!dirValidation.isValid) {
		throw new Error(dirValidation.message);
	}

	// Get available templates and features
	const templates = getAvailableTemplates();
	const features = getAvailableFeatures();

	// Select template
	let selectedTemplate = templates.find((t) => t.name === options.template);
	if (!selectedTemplate && !options.useDefaults) {
		const { template } = await inquirer.prompt([
			{
				type: "list",
				name: "template",
				message: "Which template would you like to use?",
				choices: templates.map((t) => ({
					name: `${t.name} - ${t.description}`,
					value: t.name,
				})),
				default: "full",
			},
		]);
		selectedTemplate = templates.find((t) => t.name === template);
	} else if (!selectedTemplate) {
		selectedTemplate = templates.find((t) => t.name === "full");
	}

	if (!selectedTemplate) {
		throw new Error("No template selected");
	}

	// Select features
	let selectedFeatures = options.features;
	if (selectedFeatures.length === 0 && !options.useDefaults) {
		const featureChoices = features.map((f) => ({
			name: `${f.name} - ${f.description}`,
			value: f.name,
			checked: selectedTemplate.features.includes(f.name),
		}));

		const { features: chosenFeatures } = await inquirer.prompt([
			{
				type: "checkbox",
				name: "features",
				message: "Which features would you like to include?",
				choices: featureChoices,
			},
		]);
		selectedFeatures = chosenFeatures;
	} else if (selectedFeatures.length === 0) {
		selectedFeatures = selectedTemplate.features;
	}

	const featureConfigs = features.filter((f) => selectedFeatures.includes(f.name));

	// Create project configuration
	const projectConfig: ProjectConfig = {
		name: projectName,
		template: selectedTemplate,
		selectedFeatures: featureConfigs,
		packageManager: options.packageManager,
		envVars: {},
	};

	console.log(chalk.blue("\n📋 Project Configuration:"));
	console.log(chalk.gray(`  Name: ${projectConfig.name}`));
	console.log(chalk.gray(`  Template: ${projectConfig.template.name}`));
	console.log(
		chalk.gray(
			`  Features: ${projectConfig.selectedFeatures.map((f) => f.name).join(", ") || "None"}`
		)
	);
	console.log(chalk.gray(`  Package Manager: ${projectConfig.packageManager}`));

	if (!options.useDefaults) {
		const { confirm } = await inquirer.prompt([
			{
				type: "confirm",
				name: "confirm",
				message: "Continue with this configuration?",
				default: true,
			},
		]);

		if (!confirm) {
			console.log(chalk.yellow("Aborted."));
			return;
		}
	}

	// Create project directory
	await fs.ensureDir(projectPath);

	try {
		console.log(chalk.blue("\n🚀 Creating your ShipKit app...\n"));

		// Scaffold the project
		const spinner = ora("Scaffolding project files...").start();
		await scaffoldProject(projectPath, projectConfig);
		spinner.succeed("Project files created");

		// Install dependencies
		if (!options.skipInstall) {
			const installSpinner = ora("Installing dependencies...").start();
			await installDependencies(projectPath, projectConfig.packageManager);
			installSpinner.succeed("Dependencies installed");
		}

		// Initialize git
		if (!options.skipGit) {
			const gitSpinner = ora("Initializing git repository...").start();
			await initializeGit(projectPath);
			gitSpinner.succeed("Git repository initialized");
		}

		// Success message
		console.log(chalk.green("\n✅ Your ShipKit app has been created!\n"));
		console.log(chalk.blue("Next steps:"));
		console.log(chalk.gray(`  cd ${projectName}`));

		if (options.skipInstall) {
			console.log(chalk.gray(`  ${projectConfig.packageManager} install`));
		}

		console.log(chalk.gray(`  ${projectConfig.packageManager} run dev`));
		console.log(chalk.blue("\nHappy coding! 🎉"));
	} catch (error) {
		// Cleanup on error
		try {
			await fs.remove(projectPath);
		} catch {
			// Ignore cleanup errors
		}
		throw error;
	}
}
