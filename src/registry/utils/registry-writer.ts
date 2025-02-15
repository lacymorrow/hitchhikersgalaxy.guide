import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import type {
	DocItem,
	FileTypeValue,
	RegistryItem,
	RegistryTypeValue,
} from "../schema";

/**
 * Groups registry items by their type
 */
export const groupRegistryByType = (registry: RegistryItem[]) => {
	return registry.reduce(
		(acc, item) => {
			const type = item.type.replace("registry:", "");
			if (!acc[type]) {
				acc[type] = [];
			}
			acc[type].push(item);
			return acc;
		},
		{} as Record<string, RegistryItem[]>,
	);
};

/**
 * Creates the main registry index
 */
export const createMainIndex = (
	groupedRegistry: Record<string, RegistryItem[]>,
) => {
	return Object.entries(groupedRegistry).map(([type, items]) => {
		const registryType = type as RegistryTypeValue;
		return {
			type: `registry:${type}`,
			components: items
				.filter(
					(
						item,
					): item is RegistryItem & { files: [{ path: string }, ...any[]] } =>
						Boolean(item.files[0]?.path),
				)
				.map((item) => ({
					name: item.name,
					path: `${item.meta?.library || "default"}/${item.meta?.theme || "default"}/${getPluralDirectoryName(type)}/${item.name}.json`,
				})),
		};
	});
};

/**
 * Creates a type index for a group of components
 */
export const createTypeIndex = (items: RegistryItem[]) => {
	return {
		components: items
			.filter(
				(
					item,
				): item is RegistryItem & { files: [{ path: string }, ...any[]] } =>
					Boolean(item.files[0]?.path),
			)
			.map((item) => ({
				name: item.name,
				path: `./${item.name}.json`,
			})),
	};
};

/**
 * Creates a preview item for a component
 */
export const createPreviewItem = (
	item: RegistryItem,
	previewFiles: { path: string; content: string; type: FileTypeValue }[],
): RegistryItem => ({
	name: `${item.name}-preview`,
	type: item.type,
	description: `Preview for ${item.name} component`,
	dependencies: [],
	devDependencies: [],
	registryDependencies: [item.name],
	files: previewFiles,
	meta: {
		library: item.meta?.library || "default",
		previewFor: item.name,
	},
});

/**
 * Gets the plural directory name for a type
 */
const getPluralDirectoryName = (type: string): string => {
	// Special cases that should not be pluralized
	if (type === "lib") return type;
	if (type === "ui") return type;

	// Pluralize other types
	return type.endsWith("s") ? type : `${type}s`;
};

/**
 * Creates a directory index that points to child indices
 */
const createDirectoryIndex = (
	groupedRegistry: Record<string, RegistryItem[]>,
): any[] => {
	return Object.entries(groupedRegistry).map(([type, items]) => {
		// Group items by library/theme combination
		const existingPaths = new Set(
			items.map(
				(item) =>
					`${item.meta?.library || "default"}/${item.meta?.theme || "default"}`,
			),
		);

		return {
			type: `registry:${type}`,
			indices: Array.from(existingPaths).map((libTheme) => ({
				path: `${libTheme}/${getPluralDirectoryName(type)}/index.json`,
			})),
		};
	});
};

/**
 * Writes all registry files to disk
 */
export const writeRegistryFiles = async (
	outputDir: string,
	groupedRegistry: Record<string, RegistryItem[]>,
	docsMapping: DocItem[],
	mainIndex: any,
	stats: any,
): Promise<void> => {
	// Write main index (points to child indices)
	const directoryIndex = createDirectoryIndex(groupedRegistry);
	await writeFile(
		join(outputDir, "index.json"),
		JSON.stringify(directoryIndex, null, 2),
	);

	// Write docs mapping
	await writeFile(
		join(outputDir, "docs.json"),
		JSON.stringify(docsMapping, null, 2),
	);

	// Write stats
	await writeFile(
		join(outputDir, "stats.json"),
		JSON.stringify(stats, null, 2),
	);

	// Write component files and create type indices
	for (const [type, items] of Object.entries(groupedRegistry)) {
		// Group items by library and theme
		const groupedByLibTheme = items.reduce(
			(acc, item) => {
				const library = item.meta?.library || "default";
				const theme = item.meta?.theme || "default";
				const key = `${library}/${theme}`;
				if (!acc[key]) {
					acc[key] = [];
				}
				acc[key].push(item);
				return acc;
			},
			{} as Record<string, RegistryItem[]>,
		);

		// Process each library/theme group
		for (const [libTheme, groupItems] of Object.entries(groupedByLibTheme)) {
			const [lib, thm] = libTheme.split("/");
			const library = lib || "default";
			const theme = thm || "default";
			const dirName = getPluralDirectoryName(type);
			const componentDir = join(outputDir, library, theme, dirName);
			await mkdir(componentDir, { recursive: true });

			// Write component files
			for (const item of groupItems) {
				const componentPath = join(componentDir, `${item.name}.json`);
				await writeFile(componentPath, JSON.stringify(item, null, 2));
			}

			// Create type index for this library/theme group (points to components)
			const typeIndex = createTypeIndex(groupItems);
			const indexPath = join(componentDir, "index.json");
			await writeFile(indexPath, JSON.stringify(typeIndex, null, 2));
		}
	}
};
