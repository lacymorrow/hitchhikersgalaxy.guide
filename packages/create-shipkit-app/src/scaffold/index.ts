import fs from "fs-extra";
import Handlebars from "handlebars";
import path from "path";
import { fileURLToPath } from "url";
import type { ProjectConfig } from "../types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Scaffold a new ShipKit project based on configuration
 */
export async function scaffoldProject(projectPath: string, config: ProjectConfig): Promise<void> {
	// Get template directory
	const templatePath = getTemplatePath(config.template.name);

	// Ensure template exists
	const templateExists = await fs.pathExists(templatePath);
	if (!templateExists) {
		throw new Error(`Template "${config.template.name}" not found at ${templatePath}`);
	}

	// Copy base template files
	await copyTemplateFiles(templatePath, projectPath, config);

	// Process feature-specific files
	await processFeatureFiles(projectPath, config);

	// Generate package.json
	await generatePackageJson(projectPath, config);

	// Generate environment files
	await generateEnvFiles(projectPath, config);

	// Generate configuration files
	await generateConfigFiles(projectPath, config);
}

/**
 * Get the path to a template directory
 */
function getTemplatePath(templateName: string): string {
	// In production, templates will be included in the package
	return path.join(__dirname, "../../templates", templateName);
}

/**
 * Copy template files from source to destination, processing them as Handlebars templates
 */
async function copyTemplateFiles(
	sourcePath: string,
	destPath: string,
	config: ProjectConfig
): Promise<void> {
	const files = await getFilesRecursively(sourcePath);

	const templateData = {
		projectName: config.name,
		template: config.template,
		features: config.selectedFeatures,
		packageManager: config.packageManager,
		envVars: config.envVars,
	};

	for (const file of files) {
		const relativePath = path.relative(sourcePath, file);
		const destFile = path.join(destPath, relativePath);

		// Ensure destination directory exists
		await fs.ensureDir(path.dirname(destFile));

		// Read source file
		const content = await fs.readFile(file, "utf-8");

		// Process as Handlebars template if it's a text file
		let processedContent = content;
		if (isTextFile(file)) {
			try {
				const template = Handlebars.compile(content);
				processedContent = template(templateData);
			} catch (error) {
				// If template compilation fails, use original content
				console.warn(`Warning: Failed to process template ${relativePath}`);
			}
		}

		// Write processed content
		await fs.writeFile(destFile, processedContent);
	}
}

/**
 * Process feature-specific files
 */
async function processFeatureFiles(projectPath: string, config: ProjectConfig): Promise<void> {
	// For now, we'll handle feature-specific files in the main template
	// In the future, we could have separate feature directories

	// Remove unused authentication files based on selected auth features
	const authFeatures = config.selectedFeatures.filter((f) => f.category === "authentication");
	if (authFeatures.length === 0) {
		// Remove all auth-related files if no auth is selected
		await removeAuthFiles(projectPath);
	}
}

/**
 * Generate package.json with selected dependencies
 */
async function generatePackageJson(projectPath: string, config: ProjectConfig): Promise<void> {
	const packageJsonPath = path.join(projectPath, "package.json");

	// Collect all dependencies from template and features
	const allDependencies = new Set([
		...config.template.dependencies,
		...config.selectedFeatures.flatMap((f) => f.dependencies),
	]);

	const allDevDependencies = new Set([
		...(config.template.devDependencies ?? []),
		...config.selectedFeatures.flatMap((f) => f.devDependencies ?? []),
	]);

	const packageJson = {
		name: config.name,
		version: "0.1.0",
		private: true,
		type: "module",
		scripts: {
			build: "next build",
			dev: "next dev",
			start: "next start",
			lint: "next lint",
			"type-check": "tsc --noEmit",
		},
		dependencies: Object.fromEntries(
			Array.from(allDependencies)
				.sort()
				.map((dep) => [dep, "latest"])
		),
		devDependencies: Object.fromEntries(
			Array.from(allDevDependencies)
				.sort()
				.map((dep) => [dep, "latest"])
		),
	};

	await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

/**
 * Generate environment files
 */
async function generateEnvFiles(projectPath: string, config: ProjectConfig): Promise<void> {
	const envLocalPath = path.join(projectPath, ".env.local");
	const envExamplePath = path.join(projectPath, ".env.example");

	// Collect all environment variables from features
	const allEnvVars = new Set([...config.selectedFeatures.flatMap((f) => f.envVars)]);

	const envContent = Array.from(allEnvVars)
		.sort()
		.map((envVar) => `${envVar}=`)
		.join("\n");

	const envExampleContent = Array.from(allEnvVars)
		.sort()
		.map((envVar) => `${envVar}=your_${envVar.toLowerCase()}_here`)
		.join("\n");

	if (envContent) {
		await fs.writeFile(envLocalPath, `${envContent}\n`);
		await fs.writeFile(envExamplePath, `${envExampleContent}\n`);
	}
}

/**
 * Generate configuration files
 */
async function generateConfigFiles(projectPath: string, config: ProjectConfig): Promise<void> {
	// Generate any additional configuration files based on selected features
	// This could include:
	// - tailwind.config.ts
	// - next.config.ts
	// - drizzle.config.ts
	// - etc.
}

/**
 * Get all files recursively from a directory
 */
async function getFilesRecursively(dirPath: string): Promise<string[]> {
	const files: string[] = [];

	async function traverse(currentPath: string) {
		const items = await fs.readdir(currentPath);

		for (const item of items) {
			const itemPath = path.join(currentPath, item);
			const stats = await fs.stat(itemPath);

			if (stats.isDirectory()) {
				await traverse(itemPath);
			} else {
				files.push(itemPath);
			}
		}
	}

	await traverse(dirPath);
	return files;
}

/**
 * Check if a file is a text file that can be processed as a template
 */
function isTextFile(filePath: string): boolean {
	const textExtensions = [
		".ts",
		".tsx",
		".js",
		".jsx",
		".json",
		".md",
		".mdx",
		".txt",
		".yml",
		".yaml",
		".toml",
		".ini",
		".env",
		".css",
		".scss",
		".sass",
		".less",
		".html",
		".xml",
		".svg",
		".gitignore",
		".gitattributes",
	];

	const ext = path.extname(filePath).toLowerCase();
	return textExtensions.includes(ext);
}

/**
 * Remove authentication-related files when no auth is selected
 */
async function removeAuthFiles(projectPath: string): Promise<void> {
	const authPaths = ["src/app/(authentication)", "src/lib/auth.ts", "src/middleware.ts"];

	for (const authPath of authPaths) {
		const fullPath = path.join(projectPath, authPath);
		const exists = await fs.pathExists(fullPath);
		if (exists) {
			await fs.remove(fullPath);
		}
	}
}
