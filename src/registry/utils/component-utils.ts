/**
 * Map to track component name conflicts across libraries
 */
const componentNameConflicts = new Map<string, Set<string>>();

/**
 * Gets the library name from a file path
 */
export const getLibraryName = (relativePath: string): string => {
	const parts = relativePath.split("/");
	// Look for shadcn, lacy, etc.
	const libraryIndex = parts.findIndex(
		(part) => part && ["shadcn", "lacy"].includes(part.toLowerCase()),
	);

	if (libraryIndex !== -1 && parts[libraryIndex]) {
		return parts[libraryIndex];
	}

	return "default";
};

/**
 * Gets the theme name from a file path
 */
export const getThemeName = (relativePath: string): string => {
	const parts = relativePath.split("/");
	// Look for new-york, default, etc.
	const themeIndex = parts.findIndex(
		(part) => part && ["new-york", "default"].includes(part.toLowerCase()),
	);

	if (themeIndex !== -1 && parts[themeIndex]) {
		return parts[themeIndex];
	}

	return "default";
};

/**
 * Collects all component names and their libraries to handle conflicts
 */
export const collectComponentNames = async (
	files: string[],
	componentsDir: string,
): Promise<void> => {
	for (const filepath of files) {
		const relativePath = filepath.replace(`${componentsDir}/`, "");
		const pathParts = relativePath.split("/");
		const lastPart = pathParts[pathParts.length - 1];
		if (!lastPart) continue;

		const baseName = lastPart.replace(/\.(tsx|ts)$/, "");
		const libraryName = getLibraryName(relativePath);

		if (libraryName) {
			if (!componentNameConflicts.has(baseName)) {
				componentNameConflicts.set(baseName, new Set());
			}
			componentNameConflicts.get(baseName)?.add(libraryName);
		}
	}
};

/**
 * Gets the final component name based on library conflicts
 */
export const getComponentName = (
	baseName: string,
	_libraryName: string, // Unused now that we organize by directory
): string => {
	// Just return the base name since we organize by directory structure now
	return baseName;
};

/**
 * Extracts the base name from a file path
 */
export const getBaseName = (filePath: string): string => {
	const pathParts = filePath.split("/");
	const lastPart = pathParts[pathParts.length - 1];
	if (!lastPart) {
		throw new Error(`Invalid file path: ${filePath}`);
	}
	return lastPart.replace(/\.(tsx|ts)$/, "");
};
