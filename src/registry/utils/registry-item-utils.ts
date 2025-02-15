import { readFile } from "fs/promises";
import { dirname, join } from "path";
import type { RegistryItem, RegistryTypeValue } from "../schema";
import { ShadcnSchema } from "../schema";
import {
	extractImports,
	extractMetadata,
	parseTypeScriptFile,
} from "./ast-utils";
import {
	getBaseName,
	getComponentName,
	getLibraryName,
	getThemeName,
} from "./component-utils";
import {
	extractCSSVars,
	extractTailwindConfig,
	getComponentMetadata,
	getDirectoryMetadata,
} from "./metadata-utils";
import { attribution } from "./registry-utils";

/**
 * Gets the registry type based on the file path
 */
export const getRegistryType = (relativePath: string): RegistryTypeValue => {
	const pathParts = relativePath.split("/");

	// Check if the path contains any of our special directories
	if (pathParts.includes("lib")) return "registry:lib";
	if (pathParts.includes("blocks")) return "registry:block";
	if (pathParts.includes("hooks")) return "registry:hook";
	if (pathParts.includes("theme")) return "registry:theme";
	if (pathParts.includes("pages")) return "registry:page";

	// Default to UI components
	return "registry:ui";
};

/**
 * Generates a preview item for a component
 */
export const generatePreviewItem = async (
	previewPath: string,
	componentName: string,
	type: RegistryTypeValue,
	libraryName: string,
	relativePath: string,
): Promise<RegistryItem | undefined> => {
	try {
		const previewContent = await readFile(previewPath, "utf-8");
		if (!previewContent) return undefined;

		const theme =
			relativePath
				.split("/")
				.find((part) => part === "new-york" || part === "default") || "default";

		return ShadcnSchema.parse({
			name: `${componentName}-preview`,
			type,
			description: `Preview for ${componentName} component`,
			dependencies: [],
			devDependencies: [],
			registryDependencies: [componentName],
			files: [
				{
					path: `${libraryName || "default"}/${theme}/${type.replace("registry:", "")}/${componentName}.preview.tsx`,
					content: `${attribution}\n${previewContent}`,
					type: "preview",
				},
			],
			meta: {
				library: libraryName || "default",
				theme,
				previewFor: componentName,
			},
		});
	} catch {
		return undefined;
	}
};

/**
 * Normalizes import paths to use @/registry/default/
 */
const normalizeImportPaths = (content: string): string => {
	return content.replace(
		/@\/registry\/new-york\/(ui|hooks)\//g,
		"@/registry/default/$1/",
	);
};

/**
 * Gets the directory prefix based on registry type
 */
const getDirectoryPrefix = (type: RegistryTypeValue): string => {
	switch (type) {
		case "registry:block":
			return "blocks";
		case "registry:hook":
			return "hooks";
		case "registry:lib":
			return "lib";
		case "registry:theme":
			return "theme";
		case "registry:page":
			return "pages";
		default:
			return "ui";
	}
};

/**
 * Ensures the Tailwind config matches the registry schema
 */
const normalizeTailwindConfig = (config: any) => {
	if (!config?.config) return { config: {} };

	return {
		config: {
			content: Array.isArray(config.config.content)
				? config.config.content
				: undefined,
			theme: config.config.theme || undefined,
			plugins: Array.isArray(config.config.plugins)
				? config.config.plugins
				: undefined,
		},
	};
};

/**
 * Checks if an object has any non-empty values
 */
const hasNonEmptyValues = (obj: Record<string, any>): boolean => {
	if (!obj) return false;

	// Special case for CSS vars - always include them if they exist
	if (obj.light || obj.dark) {
		return true;
	}

	return Object.keys(obj).some((key) => {
		const value = obj[key];
		if (typeof value === "object") {
			return hasNonEmptyValues(value);
		}
		return value !== undefined && value !== null && value !== "";
	});
};

/**
 * Generates a registry item from a component file
 */
export const generateRegistryItem = async (
	filePath: string,
	componentsDir: string,
): Promise<{ component: RegistryItem; preview?: RegistryItem } | null> => {
	// Skip preview files
	if (filePath.endsWith(".preview.tsx")) {
		return null;
	}

	const content = await readFile(filePath, "utf-8");
	const normalizedContent = normalizeImportPaths(content);
	const ast = parseTypeScriptFile(normalizedContent);

	const { dependencies, registryDependencies } = extractImports(ast);
	const relativePath = filePath.replace(`${componentsDir}/`, "");

	// Get component details
	const baseName = getBaseName(filePath);
	const libraryName = getLibraryName(relativePath);
	const themeName = getThemeName(relativePath);
	const name = getComponentName(baseName, libraryName);
	const type = getRegistryType(relativePath);

	// Get metadata from both component and directory
	const dirMetadata = await getDirectoryMetadata(dirname(filePath));
	const componentMetadata = await getComponentMetadata(filePath);
	const fileMetadata = extractMetadata(ast);

	// Merge metadata with priority: component > directory > file
	const metadata = {
		...fileMetadata,
		...dirMetadata.meta,
		...componentMetadata.meta,
	};

	// Extract style configurations with priority: component > directory
	const dirCssVars = extractCSSVars(dirMetadata);
	const componentCssVars = extractCSSVars(componentMetadata);
	const cssVars = {
		light: {
			...dirCssVars.light,
			...componentCssVars.light,
		},
		dark: {
			...dirCssVars.dark,
			...componentCssVars.dark,
		},
	};

	const tailwind = normalizeTailwindConfig({
		...extractTailwindConfig(dirMetadata),
		...extractTailwindConfig(componentMetadata),
	});

	// Extract the relative path without library/theme prefix
	const getCleanPath = (path: string) => {
		// Remove library/theme prefix from path
		const parts = path.split("/");
		// Find the index of 'ui', 'lib', 'block', etc.
		const typeIndex = parts.findIndex((part) =>
			["ui", "lib", "block", "component", "hook", "theme", "page"].includes(
				part,
			),
		);

		// If found, return everything from that index onwards
		return typeIndex !== -1 ? parts.slice(typeIndex).join("/") : path;
	};

	// Create the main component registry item
	const registryItem: RegistryItem = {
		name,
		type,
		description: metadata.description,
		dependencies,
		devDependencies: metadata.devDependencies || [],
		registryDependencies,
		files: [
			{
				path: `${getDirectoryPrefix(type)}/${baseName}.tsx`,
				content: `${attribution}\n${normalizedContent}`,
				type,
				target: metadata.target,
			},
		],

		docs: metadata.docs,
		categories: metadata.categories,
		meta: {
			...metadata,
			library: libraryName,
			theme: themeName,
		},
	};

	// Always include tailwind and cssVars if they exist in the metadata
	if (dirMetadata.tailwind || componentMetadata.tailwind) {
		registryItem.tailwind = tailwind;
	}

	// Only include cssVars if they contain non-empty values
	if (hasNonEmptyValues(cssVars.light) || hasNonEmptyValues(cssVars.dark)) {
		registryItem.cssVars = cssVars;
	}

	// Check for preview file
	const previewPath = join(dirname(filePath), `${baseName}.preview.tsx`);
	try {
		const previewContent = await readFile(previewPath, "utf-8");
		if (!previewContent) return { component: registryItem };

		const previewItem = {
			name: `${name}-preview`,
			type,
			description: `Preview for ${name} component`,
			dependencies: [],
			devDependencies: [],
			registryDependencies: [name],
			files: [
				{
					path: `${getDirectoryPrefix(type)}/${baseName}.preview.tsx`,
					content: `${attribution}\n${previewContent}`,
					type: "preview",
				},
			],
			meta: {
				library: libraryName,
				theme: themeName,
				previewFor: name,
			},
		};

		// Update the main component to indicate it has a preview
		registryItem.meta = {
			...registryItem.meta,
			hasPreview: true,
		};

		return {
			component: registryItem,
			preview: ShadcnSchema.parse(previewItem),
		};
	} catch {
		return { component: registryItem };
	}
};
