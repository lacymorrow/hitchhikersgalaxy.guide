import type { DocItem, RegistryItem } from "./schema";
import { collectComponentNames } from "./utils/component-utils";
import { generateRegistryItem } from "./utils/registry-item-utils";
import {
	cleanDirectory,
	formatProgress,
	getAllFiles,
	isTypescriptFile,
} from "./utils/registry-utils";
import {
	createMainIndex,
	groupRegistryByType,
	writeRegistryFiles,
} from "./utils/registry-writer";
import {
	createInitialStats,
	createStatsSummary,
	updateStats,
} from "./utils/stats-utils";

/**
 * Generates a registry from a components directory
 */
export const generateRegistry = async (
	componentsDir: string,
	outputDir: string,
): Promise<void> => {
	try {
		const startTime = performance.now();
		const stats = createInitialStats();

		// Add docs mapping
		const docsMapping: DocItem[] = [];

		// Clean and recreate output directory
		console.info("🧹 Cleaning existing registry files...");
		await cleanDirectory(outputDir);

		console.info("🔍 Scanning components directory:", componentsDir);
		const files = await getAllFiles(componentsDir);
		const tsFiles = files.filter(isTypescriptFile);
		const totalFiles = tsFiles.length;

		console.info(`\n📦 Found ${totalFiles} TypeScript files to process\n`);

		// First pass: collect all component names and their libraries
		console.info("🔍 Analyzing component names...");
		await collectComponentNames(tsFiles, componentsDir);

		const registry: RegistryItem[] = [];
		const seen = new Set<string>();

		// Clear the last line to update progress
		process.stdout.write("\x1B[1A\x1B[2K");

		// Second pass: generate registry items
		for (let i = 0; i < tsFiles.length; i++) {
			const filepath = tsFiles[i];
			if (!filepath) continue;

			const item = await generateRegistryItem(filepath, componentsDir);
			if (!item?.component?.files[0]?.path) continue;

			const relativePath = filepath
				.replace(`${componentsDir}/`, "")
				.replace(/\.(tsx|ts)$/, "");

			// Display progress
			process.stdout.write("\x1B[1A\x1B[2K"); // Move up one line and clear it
			console.info(`Processing: ${formatProgress(i + 1, totalFiles)}`);
			console.info(`Current file: ${relativePath}`);

			// Create a unique identifier that includes the path to avoid name collisions
			const uniqueId = item.component.files[0].path;
			if (seen.has(uniqueId)) {
				console.info(`⚠️  Skipping duplicate: ${uniqueId}`);
				continue;
			}
			seen.add(uniqueId);

			// Add to docs mapping
			docsMapping.push({
				name: item.component.name,
				type: item.component.type,
				library: item.component.meta?.library || "default",
				description: item.component.description,
				previewPath: item.component.meta?.hasPreview
					? `@/app/ui/registry/src/${relativePath}.preview`
					: undefined,
				sourcePath: `@/app/ui/registry/src/${relativePath}`,
				categories: item.component.categories,
				files: item.component.files,
				dependencies: item.component.dependencies,
				devDependencies: item.component.devDependencies,
				registryDependencies: item.component.registryDependencies,
				docs: item.component.docs,
				meta: item.component.meta,
				cssVars: item.component.cssVars,
				tailwind: item.component.tailwind,
			});

			// Update statistics
			updateStats(stats, item.component);

			// Add component to registry
			registry.push(item.component);

			// Add preview to registry if it exists
			if (item.preview) {
				registry.push(item.preview);
			}
		}

		// Group components by type
		console.info("\n📝 Organizing registry by type...");
		const groupedRegistry = groupRegistryByType(registry);

		// Calculate final stats
		stats.processingTimeMs = Math.round(performance.now() - startTime);
		const statsSummary = createStatsSummary(stats);

		// Create main index
		const mainIndex = createMainIndex(groupedRegistry);

		// Write all registry files
		await writeRegistryFiles(
			outputDir,
			groupedRegistry,
			docsMapping,
			mainIndex,
			statsSummary,
		);

		// Log final summary with a nice box
		const separator = "═".repeat(50);
		console.info(`\n${separator}`);
		console.info("📊 Registry Generation Summary");
		console.info(separator);
		console.info("\n🧩 Components");
		console.info("  Total:", stats.totalComponents);
		console.info("\n🗂  By Type:");
		for (const [type, count] of Object.entries(stats.componentsByType)) {
			const percentage = ((count / stats.totalComponents) * 100).toFixed(1);
			console.info(`  ${type}: ${count} (${percentage}%)`);
		}

		console.info("\n🔗 Dependencies");
		console.info(`  Total: ${stats.totalDependencies}`);
		console.info(`  Unique: ${stats.uniqueDependencies.size}`);
		console.info(
			`  Registry Dependencies: ${stats.uniqueRegistryDependencies.size}`,
		);

		console.info("\n🎨 Styling");
		console.info(`  With Tailwind: ${stats.filesWithTailwind}`);
		console.info(`  With CSS Vars: ${stats.filesWithCssVars}`);

		console.info("\n⚡ Performance");
		console.info(`  Total Size: ${(stats.totalFileSize / 1024).toFixed(2)}KB`);
		console.info(
			`  Processing Time: ${(stats.processingTimeMs / 1000).toFixed(2)}s`,
		);
		console.info(
			`  Avg Time/Component: ${(stats.processingTimeMs / stats.totalComponents).toFixed(2)}ms`,
		);
		console.info(`${separator}\n`);
	} catch (error) {
		console.error("❌ Failed to generate registry:", error);
		throw error;
	}
};
