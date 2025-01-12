import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import type * as t from "@babel/types";
import type { ComponentMetadata } from "../schema";

// @ts-ignore - babel traverse default export workaround
const traverse = _traverse.default || _traverse;

/**
 * List of dependencies that are implicit in React projects
 */
const EXCLUDED_DEPENDENCIES = new Set([
	"react",
	"react-dom",
	"react/jsx-runtime",
	"@types/react",
	"@types/react-dom",
]);

/**
 * Map of package names to their normalized versions
 */
const PACKAGE_NAME_MAP: Record<string, string> = {
	"next-auth/react": "next-auth",
	"next-auth/jwt": "next-auth",
	"next-auth/providers": "next-auth",
	"next/navigation": "next",
	"next/router": "next",
	"next/link": "next",
	"next/image": "next",
	"next/headers": "next",
	"next/server": "next",
	"react/jsx-runtime": "react",
	"@radix-ui/react-icons": "@radix-ui/react-icons",
	"lucide-react": "lucide-react",
};

/**
 * Type guard to check if a key exists in PACKAGE_NAME_MAP
 */
const isKnownPackage = (key: string): key is keyof typeof PACKAGE_NAME_MAP => {
	return key in PACKAGE_NAME_MAP;
};

/**
 * Normalizes a package name to its base package
 */
const normalizePackageName = (source: string): string => {
	// If it's in our map, use that
	if (isKnownPackage(source)) {
		return PACKAGE_NAME_MAP[source];
	}

	// For @org/package/subpath, return @org/package
	if (source.startsWith("@")) {
		const parts = source.split("/");
		return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : source;
	}

	// For package/subpath, return package
	return source.split("/")[0] || source;
};

/**
 * Extracts imports from an AST, categorizing them as dependencies or registry dependencies
 */
export const extractImports = (
	ast: t.File,
): { dependencies: string[]; registryDependencies: string[] } => {
	const imports = {
		dependencies: new Set<string>(),
		registryDependencies: new Set<string>(),
	};

	traverse(ast, {
		ImportDeclaration(path: { node: t.ImportDeclaration }) {
			const source = path.node.source.value;
			if (!source) return;

			// Local UI components and hooks are registry dependencies
			if (
				source.startsWith("./") ||
				source.startsWith("@/components/ui/") ||
				source.startsWith("@/registry/default/") ||
				source.startsWith("@/hooks/") ||
				source.startsWith("@/hooks/") ||
				source.startsWith("@/ui/")
			) {
				const componentName = source
					.replace(/^\.\//, "")
					.replace(/^@\/components\/ui\//, "")
					.replace(/^@\/registry\/default\/(ui|hooks)\//, "")
					.replace(/^@\/registry\/new-york\/(ui|hooks)\//, "")
					.replace(/^@\/hooks\//, "")
					.replace(/\.(tsx|ts)$/, "");
				imports.registryDependencies.add(componentName);
			}
			// External packages are dependencies, except for excluded ones
			else if (!source.startsWith("@/") && !EXCLUDED_DEPENDENCIES.has(source)) {
				imports.dependencies.add(normalizePackageName(source));
			}
		},
	});

	return {
		dependencies: Array.from(imports.dependencies).sort(),
		registryDependencies: Array.from(imports.registryDependencies).sort(),
	};
};

/**
 * Extracts metadata from an object expression in the AST
 */
export const extractMetadataFromObjectExpression = (
	node: t.ObjectExpression,
): Record<string, any> => {
	const metadata: Record<string, any> = {};

	for (const prop of node.properties) {
		if (prop.type !== "ObjectProperty" || !("name" in prop.key)) continue;

		const key = prop.key.name;
		const value = prop.value;

		if (value.type === "StringLiteral") {
			metadata[key] = value.value;
		} else if (value.type === "BooleanLiteral") {
			metadata[key] = value.value;
		} else if (value.type === "NumericLiteral") {
			metadata[key] = value.value;
		} else if (value.type === "ArrayExpression") {
			metadata[key] = value.elements
				.filter(
					(el): el is t.StringLiteral | t.NumericLiteral | t.BooleanLiteral =>
						["StringLiteral", "NumericLiteral", "BooleanLiteral"].includes(
							el?.type || "",
						),
				)
				.map((el) => ("value" in el ? el.value : null))
				.filter(Boolean);
		} else if (value.type === "ObjectExpression") {
			metadata[key] = extractMetadataFromObjectExpression(value);
		}
	}

	return metadata;
};

/**
 * Extracts metadata from an AST
 */
export const extractMetadata = (ast: t.File): ComponentMetadata => {
	let metadata: ComponentMetadata = {};

	traverse(ast, {
		ExportDefaultDeclaration(path: { node: t.ExportDefaultDeclaration }) {
			const declaration = path.node.declaration;
			if (declaration.type === "ObjectExpression") {
				metadata = extractMetadataFromObjectExpression(declaration);
			}
		},
		ExportNamedDeclaration(path: { node: t.ExportNamedDeclaration }) {
			if (
				path.node.declaration?.type === "VariableDeclaration" &&
				path.node.declaration.declarations[0]?.id.type === "Identifier" &&
				path.node.declaration.declarations[0]?.id.name === "metadata" &&
				path.node.declaration.declarations[0].init?.type === "ObjectExpression"
			) {
				metadata = extractMetadataFromObjectExpression(
					path.node.declaration.declarations[0].init,
				);
			}
		},
	});

	return metadata;
};

/**
 * Parses a TypeScript/TSX file into an AST
 */
export const parseTypeScriptFile = (content: string): t.File => {
	return parse(content, {
		sourceType: "module",
		plugins: ["typescript", "jsx"],
	});
};
