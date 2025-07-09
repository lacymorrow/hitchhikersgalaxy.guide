import fs from "fs-extra";
import path from "path";
import validatePackageName from "validate-npm-package-name";
import type { ValidationResult } from "../types.js";

/**
 * Validates a project name for creating a new ShipKit app
 */
export function validateProjectName(name: string): ValidationResult {
	const validation = validatePackageName(name);

	if (!validation.validForNewPackages) {
		const issues = [...(validation.errors ?? []), ...(validation.warnings ?? [])];
		return {
			isValid: false,
			message: `Invalid project name "${name}": ${issues.join(", ")}`,
		};
	}

	return { isValid: true };
}

/**
 * Validates that a directory is suitable for creating a new project
 */
export async function validateProjectDirectory(projectPath: string): Promise<ValidationResult> {
	try {
		const exists = await fs.pathExists(projectPath);

		if (exists) {
			const stats = await fs.stat(projectPath);
			if (!stats.isDirectory()) {
				return {
					isValid: false,
					message: `Path "${projectPath}" exists but is not a directory`,
				};
			}

			const files = await fs.readdir(projectPath);
			if (files.length > 0) {
				return {
					isValid: false,
					message: `Directory "${projectPath}" is not empty`,
				};
			}
		}

		return { isValid: true };
	} catch (error) {
		return {
			isValid: false,
			message: `Cannot access directory "${projectPath}": ${error instanceof Error ? error.message : "Unknown error"}`,
		};
	}
}

/**
 * Validates that required tools are available
 */
export function validateSystemRequirements(): ValidationResult {
	// Check Node.js version
	const nodeVersion = process.version;
	const majorVersion = Number.parseInt(nodeVersion.slice(1).split(".")[0] ?? "0");

	if (majorVersion < 18) {
		return {
			isValid: false,
			message: `Node.js 18.0.0 or higher is required. You are using ${nodeVersion}`,
		};
	}

	return { isValid: true };
}

/**
 * Validates feature names against available features
 */
export function validateFeatures(
	features: string[],
	availableFeatures: string[]
): ValidationResult {
	const invalidFeatures = features.filter((feature) => !availableFeatures.includes(feature));

	if (invalidFeatures.length > 0) {
		return {
			isValid: false,
			message: `Invalid features: ${invalidFeatures.join(", ")}. Available features: ${availableFeatures.join(", ")}`,
		};
	}

	return { isValid: true };
}
