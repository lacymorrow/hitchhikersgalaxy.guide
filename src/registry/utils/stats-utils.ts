import type { RegistryItem } from "../schema";

export interface RegistryStats {
	totalComponents: number;
	componentsByType: Record<string, number>;
	totalDependencies: number;
	uniqueDependencies: Set<string>;
	totalRegistryDependencies: number;
	uniqueRegistryDependencies: Set<string>;
	totalFileSize: number;
	processingTimeMs: number;
	filesWithTailwind: number;
	filesWithCssVars: number;
}

/**
 * Creates initial stats object
 */
export const createInitialStats = (): RegistryStats => ({
	totalComponents: 0,
	componentsByType: {},
	totalDependencies: 0,
	uniqueDependencies: new Set(),
	totalRegistryDependencies: 0,
	uniqueRegistryDependencies: new Set(),
	totalFileSize: 0,
	processingTimeMs: 0,
	filesWithTailwind: 0,
	filesWithCssVars: 0,
});

/**
 * Updates stats with a new registry item
 */
export const updateStats = (stats: RegistryStats, item: RegistryItem): void => {
	const [, type] = item.type.split(":") as [string, string];

	// Update component counts
	stats.totalComponents++;
	stats.componentsByType[type] = (stats.componentsByType[type] || 0) + 1;

	// Track dependencies
	if (item.dependencies) {
		stats.totalDependencies += item.dependencies.length;
		for (const dep of item.dependencies) {
			stats.uniqueDependencies.add(dep);
		}
	}

	if (item.registryDependencies) {
		stats.totalRegistryDependencies += item.registryDependencies.length;
		for (const dep of item.registryDependencies) {
			stats.uniqueRegistryDependencies.add(dep);
		}
	}

	// Track file size
	if (item.files[0]?.content) {
		stats.totalFileSize += item.files[0].content.length;
	}

	// Track style configurations
	if (item.tailwind) stats.filesWithTailwind++;
	if (item.cssVars) stats.filesWithCssVars++;
};

/**
 * Creates a summary of the registry stats
 */
export const createStatsSummary = (stats: RegistryStats) => ({
	totalComponents: stats.totalComponents,
	componentsByType: stats.componentsByType,
	dependencies: {
		total: stats.totalDependencies,
		unique: stats.uniqueDependencies.size,
	},
	registryDependencies: {
		total: stats.totalRegistryDependencies,
		unique: stats.uniqueRegistryDependencies.size,
	},
	styles: {
		componentsWithTailwind: stats.filesWithTailwind,
		componentsWithCssVars: stats.filesWithCssVars,
	},
	performance: {
		totalFileSize: `${(stats.totalFileSize / 1024).toFixed(2)}KB`,
		processingTime: `${(stats.processingTimeMs / 1000).toFixed(2)}s`,
		averageTimePerComponent: `${(stats.processingTimeMs / stats.totalComponents).toFixed(2)}ms`,
	},
});
