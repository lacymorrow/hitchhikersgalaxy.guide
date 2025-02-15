import type * as t from "@babel/types";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { basename, dirname, join } from "path";
import { parseTypeScriptFile } from "./ast-utils";

interface MetadataFile {
	meta?: {
		category?: string;
		tags?: string[];
		status?: string;
		version?: string;
		author?: string;
		description?: string;
		[key: string]: any;
	};
	tailwind?: {
		config?: {
			theme?: {
				extend?: Record<string, any>;
			};
		};
	};
	cssVars?: {
		light?: Record<string, string>;
		dark?: Record<string, string>;
	};
}

type LiteralValue = string | number | boolean;

/**
 * Type guard for literal nodes
 */
const isLiteralNode = (
	node: t.Node | null | undefined,
): node is t.StringLiteral | t.NumericLiteral | t.BooleanLiteral => {
	return Boolean(
		node &&
			["StringLiteral", "NumericLiteral", "BooleanLiteral"].includes(node.type),
	);
};

/**
 * Safely extracts object literal from AST
 */
const extractObjectLiteral = (
	node: t.ObjectExpression,
): Record<string, any> => {
	const result: Record<string, any> = {};

	for (const prop of node.properties) {
		if (prop.type !== "ObjectProperty") continue;

		// Handle both identifier and string literal keys
		let key: string | null = null;
		if ("name" in prop.key && typeof prop.key.name === "string") {
			key = prop.key.name;
		} else if ("value" in prop.key && typeof prop.key.value === "string") {
			key = prop.key.value;
		}
		if (!key) continue;

		let value: any;

		if ("type" in prop.value && prop.value.type === "ObjectExpression") {
			value = extractObjectLiteral(prop.value);
		} else if ("type" in prop.value && prop.value.type === "ArrayExpression") {
			value = prop.value.elements
				.filter(isLiteralNode)
				.map((el) => el.value as LiteralValue);
		} else if (
			"type" in prop.value &&
			(prop.value.type === "StringLiteral" ||
				prop.value.type === "NumericLiteral" ||
				prop.value.type === "BooleanLiteral")
		) {
			value = prop.value.value;
		}

		if (value !== undefined) {
			result[key] = value;
		}
	}

	return result;
};

/**
 * Gets metadata from a component's .meta.ts file
 */
export const getComponentMetadata = async (filePath: string): Promise<any> => {
	// Try component-specific metadata first
	const metaPath = filePath.replace(/\.tsx?$/, ".meta.ts");
	const dirPath = dirname(filePath);
	const baseName = basename(filePath, ".tsx");

	// Try different metadata file patterns
	const metaPaths = [
		metaPath, // component.meta.ts
		join(dirPath, `@${baseName}.meta.ts`), // @component.meta.ts
		join(dirPath, "metadata.ts"), // metadata.ts
	];

	for (const path of metaPaths) {
		if (!existsSync(path)) continue;

		const content = await readFile(path, "utf-8");
		const ast = parseTypeScriptFile(content);

		// Find the default export
		const defaultExport = ast.program.body.find(
			(statement: t.Statement) =>
				statement.type === "ExportDefaultDeclaration" &&
				statement.declaration.type === "ObjectExpression",
		) as t.ExportDefaultDeclaration | undefined;

		if (!defaultExport) continue;

		// Extract the object literal
		const objectLiteral = defaultExport.declaration as t.ObjectExpression;
		return extractObjectLiteral(objectLiteral);
	}

	return {};
};

/**
 * Gets metadata from a directory's metadata.ts file
 */
export const getDirectoryMetadata = async (
	dirPath: string,
): Promise<MetadataFile> => {
	try {
		const metadataPath = join(dirPath, "metadata.ts");
		const content = await readFile(metadataPath, "utf-8");
		const ast = parseTypeScriptFile(content);

		// Find the default export
		const defaultExport = ast.program.body.find(
			(node): node is t.ExportDefaultDeclaration =>
				node.type === "ExportDefaultDeclaration",
		);

		if (
			!defaultExport?.declaration ||
			defaultExport.declaration.type !== "ObjectExpression"
		) {
			return {};
		}

		// Parse the metadata object
		const metadata: MetadataFile = {};
		const extracted = extractObjectLiteral(defaultExport.declaration);

		if (extracted.meta) metadata.meta = extracted.meta;
		if (extracted.tailwind) metadata.tailwind = extracted.tailwind;
		if (extracted.cssVars) metadata.cssVars = extracted.cssVars;

		return metadata;
	} catch {
		return {};
	}
};

/**
 * Extracts CSS variables from metadata
 */
export const extractCSSVars = (metadata: any) => {
	if (!metadata?.cssVars) return { light: {}, dark: {} };

	return {
		light: metadata.cssVars.light || {},
		dark: metadata.cssVars.dark || {},
	};
};

/**
 * Extracts Tailwind config from metadata
 */
export const extractTailwindConfig = (metadata: any) => {
	if (!metadata?.tailwind) return { config: {} };

	return metadata.tailwind;
};
