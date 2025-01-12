import { type RegistryItem } from "../../../registry/schema";

interface RegistryGroup {
	[key: string]: RegistryItem[];
}

interface RegistryComponent {
	name: string;
	path: string;
}

interface RegistrySection {
	type: string;
	components: RegistryComponent[];
}

interface RegistryIndex {
	registry: RegistrySection[];
	stats: {
		totalComponents: number;
		componentsByType: Record<string, number>;
		dependencies: {
			total: number;
			unique: number;
		};
		registryDependencies: {
			total: number;
			unique: number;
		};
		styles: {
			componentsWithTailwind: number;
			componentsWithCssVars: number;
		};
		performance: {
			totalFileSize: string;
			processingTime: string;
			averageTimePerComponent: string;
		};
	};
}

/**
 * Cache for registry items to avoid repeated file reads
 */
let registryCache: RegistryGroup | null = null;

/**
 * Helper to normalize component paths
 */
function normalizeComponentPath(path: string): string {
	// Remove ./ from the start of the path
	return path.replace(/^\.\//, "");
}

/**
 * Get all registry items grouped by category
 */
export async function getRegistryItems(): Promise<RegistryGroup> {
	if (registryCache) {
		return registryCache;
	}

	try {
		// Load the docs.json file directly
		const registry = await import("../../../registry/r/docs.json");
		const items = registry.default;

		// Group items by type
		const grouped = items.reduce((acc, item) => {
			// Skip items without a type
			if (!item.type) return acc;

			const category = item.type.replace("registry:", "");
			if (!acc[category]) {
				acc[category] = [];
			}

			// Add additional metadata if needed
			const enhancedItem = {
				...item,
				// Add any computed properties here
				categories: item.categories || [],
				description: item.description || "",
				previewPath: item.sourcePath ? `${item.sourcePath}/preview` : undefined,
			};

			acc[category].push(enhancedItem);
			return acc;
		}, {} as RegistryGroup);

		registryCache = grouped;
		return grouped;
	} catch (error) {
		console.error("Error loading registry:", error);
		return {};
	}
}

/**
 * Get a specific registry item by its path
 */
export async function getRegistryItem(
	path: string,
): Promise<RegistryItem | null> {
	try {
		if (!path) return null;

		const [category, name] = path.split("/");
		if (!category || !name) return null;

		const registry = await getRegistryItems();
		return registry[category]?.find((item) => item.name === name) || null;
	} catch (error) {
		console.error("Error getting registry item:", error);
		return null;
	}
}

/**
 * Get all available categories
 */
export async function getCategories(): Promise<string[]> {
	const registry = await getRegistryItems();
	return Object.keys(registry);
}

/**
 * Search registry items by query
 */
export async function searchRegistry(query: string): Promise<RegistryItem[]> {
	const registry = await getRegistryItems();
	const items = Object.values(registry).flat();

	if (!query) return items;

	const searchQuery = query.toLowerCase();
	return items.filter(
		(item) =>
			item.name.toLowerCase().includes(searchQuery) ||
			item.description?.toLowerCase().includes(searchQuery) ||
			item.categories?.some((cat) => cat.toLowerCase().includes(searchQuery)),
	);
}
