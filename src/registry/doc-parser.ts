import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import type {
	DocDependency,
	DocExample,
	DocItem,
	DocPreview,
	DocProp,
	DocState,
	DocUsage,
} from "../docss/types";

// @ts-ignore - babel traverse default export workaround
const traverse = _traverse.default || _traverse;

interface TraversePath {
	node: {
		body: Array<{
			leadingComments?: Array<{ value: string }>;
		}>;
	};
}

export function parseComponentDocs(sourceCode: string): DocItem | null {
	try {
		const ast = parse(sourceCode, {
			sourceType: "module",
			plugins: ["typescript", "jsx"],
		});

		const docs: Partial<DocItem> = {
			name: "",
			description: "",
			type: "registry:ui",
		};

		traverse(ast, {
			Program(path: TraversePath) {
				// Get the first JSDoc comment in the file
				const comments = path.node.body[0]?.leadingComments;
				if (!comments?.length) return;

				const comment = comments[0];
				if (!comment?.value) return;

				const docComment = comment.value;

				// Extract basic metadata
				const title = extractTag(docComment, "component");
				const description = extractTag(docComment, "description");
				if (title) docs.name = title;
				if (description) docs.description = description;

				docs.author = extractTag(docComment, "author");
				docs.version = extractTag(docComment, "version");
				const status = extractTag(docComment, "status");
				if (status) docs.status = status as DocItem["status"];

				// Extract preview
				const preview = extractPreview(docComment);
				if (preview) {
					docs.preview = preview;
				}

				// Extract examples with tests
				docs.examples = extractExamples(docComment);

				// Extract props with types and defaults
				docs.props = extractProps(docComment);

				// Extract usage guidelines
				docs.usage = extractUsage(docComment);

				// Extract state management
				docs.states = extractStates(docComment);

				// Extract dependencies
				docs.explicitDependencies = extractDependencies(docComment);

				// Extract accessibility and customization
				docs.accessibility = extractTag(docComment, "accessibility");
				docs.customization = extractTag(docComment, "customization");

				// Extract repository info
				if (!docs.meta) docs.meta = {};
				docs.meta.repository = extractTag(docComment, "repository");
				docs.meta.bugs = extractTag(docComment, "bugs");
			},
		});

		return docs as DocItem;
	} catch (error) {
		console.error("Error parsing component docs:", error);
		return null;
	}
}

function extractTag(comment: string, tag: string): string | undefined {
	const regex = new RegExp(`@${tag}\\s+([^\\n]+)`, "i");
	const match = comment.match(regex);
	return match?.[1]?.trim();
}

function extractMultipleTags(comment: string, tag: string): string[] {
	const regex = new RegExp(`@${tag}\\s+([^\\n]+)`, "gi");
	const matches = Array.from(comment.matchAll(regex));
	return matches
		.map((match) => match[1]?.trim())
		.filter((text): text is string => !!text);
}

function extractPreview(comment: string): DocPreview | undefined {
	const code = extractCodeBlock(comment, "preview");
	if (!code) return undefined;

	const preview: DocPreview = {
		code,
		height: extractTag(comment, "previewHeight"),
		background: extractTag(comment, "previewBackground"),
	};

	// Extract preview variants
	const variantMatches = Array.from(
		comment.matchAll(/@previewVariant\s+(\w+)\s*-\s*([^-]+)(?:-\s*dark)?/g),
	);

	if (variantMatches.length > 0) {
		preview.variants = variantMatches
			.map(([, name, background, dark]) => {
				if (!name || !background) return null;
				return {
					name: name.trim(),
					background: background.trim(),
					darkMode: !!dark,
				};
			})
			.filter(
				(variant): variant is NonNullable<typeof variant> => variant !== null,
			);
	}

	return preview;
}

function extractCodeBlock(comment: string, tag: string): string | undefined {
	const match = comment.match(
		new RegExp(`@${tag}[^$]*?\`\`\`(?:tsx?)?([^$]*?)\`\`\``, "i"),
	);
	return match?.[1]?.trim();
}

function extractExamples(comment: string): DocExample[] | undefined {
	const examples: DocExample[] = [];
	const exampleMatches = Array.from(
		comment.matchAll(
			/@example\s+([^\n]+)(?:\n\s*([^\n]+))?\n\s*```(?:tsx?)?\n([\s\S]*?)\n\s*```(?:\n\s*@test\s+([^\n]+)\s*-\s*([^\n]+))*/g,
		),
	);

	for (const match of exampleMatches) {
		const [, name, description, code, testDesc, testAssertion] = match;
		if (name && code) {
			const example: DocExample = {
				name: name.trim(),
				code: code.trim(),
			};

			if (description) {
				example.description = description.trim();
			}

			if (testDesc && testAssertion) {
				example.tests = [
					{
						description: testDesc.trim(),
						assertion: testAssertion.trim(),
					},
				];
			}

			examples.push(example);
		}
	}

	return examples.length > 0 ? examples : undefined;
}

function extractProps(comment: string): DocProp[] | undefined {
	const props: DocProp[] = [];
	const propMatches = Array.from(
		comment.matchAll(
			/@prop\s+(\w+)\s*-\s*([^-]+)(?:-\s*([^-]+))?(?:-\s*default:\s*([^-]+))?(?:-\s*required)?/g,
		),
	);

	for (const match of propMatches) {
		const [, name, description, type, defaultValue, required] = match;
		if (name && description) {
			props.push({
				name: name.trim(),
				description: description.trim(),
				type: type?.trim() || "any",
				default: defaultValue?.trim(),
				required: !!required,
			});
		}
	}

	return props.length > 0 ? props : undefined;
}

function extractUsage(comment: string): DocUsage | undefined {
	const usage: DocUsage = {
		dos: extractMultipleTags(comment, "do"),
		donts: extractMultipleTags(comment, "dont"),
		notes: extractMultipleTags(comment, "note"),
	};

	return Object.values(usage).some((arr) => arr.length > 0) ? usage : undefined;
}

function extractStates(comment: string): DocState[] | undefined {
	const states: DocState[] = [];
	const stateMatches = Array.from(
		comment.matchAll(
			/@state\s+(\w+)\s*-\s*([^-]+)(?:-\s*([^-]+))?(?:-\s*default:\s*([^-]+))?/g,
		),
	);

	for (const match of stateMatches) {
		const [, name, description, type, defaultValue] = match;
		if (name && description) {
			states.push({
				name: name.trim(),
				description: description.trim(),
				type: type?.trim() || "any",
				defaultValue: defaultValue?.trim(),
			});
		}
	}

	return states.length > 0 ? states : undefined;
}

function extractDependencies(comment: string): DocDependency[] | undefined {
	const dependencies: DocDependency[] = [];
	const depMatches = Array.from(
		comment.matchAll(
			/@dependency\s+(\w+)\s*-\s*([^-]+)(?:-\s*(npm|internal|style))?/g,
		),
	);

	for (const match of depMatches) {
		const [, name, version, type = "npm"] = match;
		if (name && version) {
			dependencies.push({
				name: name.trim(),
				version: version.trim(),
				type: type.trim() as DocDependency["type"],
			});
		}
	}

	return dependencies.length > 0 ? dependencies : undefined;
}
