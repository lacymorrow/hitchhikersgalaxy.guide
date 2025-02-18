import fs from "fs";
import path from "path";
import type { Page } from "playwright";
import { chromium } from "playwright";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Repository {
	type: string;
	url: string;
}

interface Selectors {
	componentLinks: string;
	componentTitle: string;
	componentDescription: string;
	componentTags: string;
	codeBlocks: string;
	previewHeadings: string;
}

interface ScraperConfig {
	baseUrl: string;
	registryBaseUrl: string;
	componentsPath: string;
	outputDir: string;
	style?: string;
	author?: string;
	license?: string;
	repository?: Repository;
	selectors: Selectors;
	defaultDependencies?: string[];
	browserOptions?: {
		timeout?: number;
		waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
		retries?: number;
		retryDelay?: number;
	};
	fileStructure?: {
		rootDir?: string;
		componentsFile?: string;
		metaFileName?: string;
		configFileName?: string;
		demoPrefix?: string;
		variantSeparator?: string;
		componentFileName?: string;
		componentFileExt?: string;
		componentType?: string;
	};
	categories?: string[];
	defaultVersion?: string;
	defaultStatus?: string;
}

interface RegistryComponent {
	name: string;
	type: string;
	dependencies?: string[];
	registryDependencies?: string[];
	files: {
		path: string;
		type: string;
		content?: string;
	}[];
}

interface RegistryDemo {
	name: string;
	type: string;
	registryDependencies: string[];
	files: {
		path: string;
		content: string;
		type: string;
		target?: string;
	}[];
}

const DEFAULT_CONFIG: ScraperConfig = {
	baseUrl: "https://ui.aceternity.com",
	registryBaseUrl: "https://ui.aceternity.com/registry",
	componentsPath: "/components",
	outputDir: path.join(__dirname, "..", "src", "registry", "src", "aceternity"),
	style: "default",
	author: "mannupaaji",
	license: "MIT",
	repository: {
		type: "git",
		url: "https://github.com/steven-tey/aceternity-ui",
	},
	selectors: {
		componentLinks: 'a[href^="/components/"]',
		componentTitle: 'h1[class*="text-4xl"]',
		componentDescription: 'h1[class*="text-4xl"] + p',
		componentTags: '.flex.gap-2.flex-wrap a[href^="/categories/"]',
		codeBlocks: "pre",
		previewHeadings:
			'h2:has-text("Preview"), h3:has-text("Preview"), h4:has-text("Preview")',
	},
	defaultDependencies: ["react", "@types/react", "@types/node"],
	browserOptions: {
		timeout: 120000,
		waitUntil: "networkidle",
		retries: 3,
		retryDelay: 1000,
	},
	fileStructure: {
		rootDir: "ui",
		componentsFile: "components.json",
		metaFileName: "meta.ts",
		configFileName: "block.config.json",
		demoPrefix: "demo-",
		variantSeparator: "-",
		componentFileName: "[slug]",
		componentFileExt: ".tsx",
		componentType: "registry:component",
	},
	categories: ["components", "ui"],
	defaultVersion: "1.0.0",
	defaultStatus: "stable",
};

// Function to recursively remove a directory
function removeDirectory(dirPath: string) {
	if (fs.existsSync(dirPath)) {
		const files = fs.readdirSync(dirPath);
		for (const file of files) {
			const curPath = path.join(dirPath, file);
			if (fs.lstatSync(curPath).isDirectory()) {
				removeDirectory(curPath);
			} else {
				fs.unlinkSync(curPath);
			}
		}
		fs.rmdirSync(dirPath);
	}
}

interface ComponentInfo {
	name: string;
	slug: string;
	description: string;
	docsUrl: string;
	dependencies: {
		core: string[];
		component: string[];
	};
	files: ComponentFile[];
	examples: ComponentExample[];
}

interface ComponentFile {
	path: string;
	content: string;
	type: "component" | "utility" | "data";
}

interface ComponentExample {
	title: string;
	code: string;
	variant?: string;
}

async function getComponentsList(
	config: ScraperConfig,
): Promise<{ name: string; url: string; description: string }[]> {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	try {
		await page.goto(`${config.baseUrl}${config.componentsPath}`, {
			waitUntil: config.browserOptions?.waitUntil || "domcontentloaded",
		});

		const components = await page.evaluate((selector: string) => {
			const links = Array.from(document.querySelectorAll(selector));
			return links.map((link) => {
				const container = link.closest("div");
				const description = container?.querySelector("p")?.textContent || "";
				return {
					name: link.textContent?.replace(/New$/, "").trim() || "",
					url: link.getAttribute("href") || "",
					description,
				};
			});
		}, config.selectors.componentLinks);

		await browser.close();
		return components;
	} catch (error) {
		console.error("Error getting components list:", error);
		await browser.close();
		throw error;
	}
}

async function fetchRegistryData(
	componentName: string,
	config: ScraperConfig,
): Promise<{
	component?: RegistryComponent;
	demo?: RegistryDemo;
}> {
	const results: { component?: RegistryComponent; demo?: RegistryDemo } = {};

	try {
		// Fetch component registry data
		const componentResponse = await fetch(
			`${config.registryBaseUrl}/${componentName}.json`,
		);
		if (componentResponse.ok) {
			results.component = await componentResponse.json();
		}

		// Fetch demo registry data
		const demoResponse = await fetch(
			`${config.registryBaseUrl}/${componentName}-demo.json`,
		);
		if (demoResponse.ok) {
			results.demo = await demoResponse.json();
		}
	} catch (error) {
		console.log(`⚠️ Registry data not found for ${componentName}`);
	}

	return results;
}

async function scrapeComponent(
	url: string,
	config: ScraperConfig,
): Promise<ComponentInfo> {
	const retries = config.browserOptions?.retries || 3;
	const retryDelay = config.browserOptions?.retryDelay || 1000;
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= retries; attempt++) {
		const browser = await chromium.launch({
			timeout: config.browserOptions?.timeout,
		});
		const page = await browser.newPage();

		try {
			console.log(`Navigating to ${url}... (attempt ${attempt}/${retries})`);
			await page.goto(url, {
				timeout: config.browserOptions?.timeout,
				waitUntil: config.browserOptions?.waitUntil,
			});

			await page.waitForSelector(config.selectors.componentTitle, {
				timeout: config.browserOptions?.timeout,
			});

			console.log("Getting component info...");
			const name =
				(await page
					.locator(config.selectors.componentTitle)
					.first()
					.textContent()) || "";
			const description =
				(await page
					.locator(config.selectors.componentDescription)
					.first()
					.textContent()) || "";
			const cleanDescription = description
				.replace(/self\.__wrap.*$/, "")
				.trim();
			const slug = url.split("/").pop() || "";

			const tags = await page
				.locator(config.selectors.componentTags)
				.allTextContents();
			const cleanTags = tags.map((tag) => tag.toLowerCase().trim());

			// Fetch registry data
			console.log("Fetching registry data...");
			const registryData = await fetchRegistryData(slug, config);

			const { dependencies, fullCode } = await extractCodeAndDependencies(
				page,
				config,
			);
			const { examples, installInstructions } = await extractExamples(
				page,
				config,
			);

			await browser.close();

			// Merge dependencies from registry
			if (registryData.component?.dependencies) {
				dependencies.core.push(...registryData.component.dependencies);
			}

			const blockConfig = createBlockConfig({
				slug,
				description: cleanDescription,
				dependencies,
				name,
				tags: cleanTags,
				docsUrl: url,
				config,
				registryData,
			});

			// Add demo files if available
			if (registryData.demo?.files) {
				examples.push(
					...registryData.demo.files
						.filter((f) => f.content && f.path.endsWith(".tsx"))
						.map((f) => ({
							title: "demo",
							code: f.content!,
							variant: "demo",
						})),
				);
			}

			return {
				name: name.replace(/New$/, "").trim(),
				slug,
				description: cleanDescription,
				docsUrl: url,
				dependencies,
				files: createFiles({
					slug,
					fullCode,
					blockConfig,
					examples,
					installInstructions,
					config,
				}),
				examples,
			};
		} catch (error) {
			lastError = error as Error;
			await browser.close();

			if (attempt === retries) {
				throw error;
			}

			console.log(`Attempt ${attempt} failed, retrying...`);
			await new Promise((resolve) =>
				setTimeout(resolve, retryDelay * 2 ** (attempt - 1)),
			);
		}
	}

	throw lastError;
}

async function extractCodeAndDependencies(page: Page, config: ScraperConfig) {
	console.log("Getting dependencies...");
	const dependencies = {
		core: [] as string[],
		component: [] as string[],
	};

	const installBlocks = await page.locator('pre:has-text("npm i")').all();
	for (const block of installBlocks) {
		const text = (await block.textContent()) || "";
		if (text) {
			const deps = text.replace("npm i ", "").split(" ").filter(Boolean);
			if (text.includes("three") || text.includes("@react-three")) {
				dependencies.component.push(...deps);
			} else {
				dependencies.core.push(...deps);
			}
		}
	}

	console.log("Getting component code...");
	const allCodeBlocks = await page.locator(config.selectors.codeBlocks).all();
	let componentCode = "";
	let utilityCode = "";

	for (const block of allCodeBlocks) {
		const code = (await block.textContent()) || "";
		if (!code.includes("npm i")) {
			const cleanCode = code
				.replace(/^```.*\n/, "")
				.replace(/```$/, "")
				.trim();

			if (code.includes("export") && !code.includes("cn(")) {
				componentCode = cleanCode;
			} else if (code.includes("cn(")) {
				utilityCode = cleanCode;
			}
		}
	}

	const fullCode = [utilityCode, componentCode].filter(Boolean).join("\n\n");

	return { dependencies, fullCode };
}

async function extractExamples(page: Page, config: ScraperConfig) {
	console.log("Getting examples...");
	const examples: ComponentExample[] = [];
	const installInstructions: ComponentExample[] = [];

	const codeTabs = await page.locator('button:has-text("Code")').all();
	for (const tab of codeTabs) {
		await tab.click();
		await page.waitForTimeout(100);
	}

	const codeBlocks = await page
		.locator("[data-rehype-pretty-code-fragment] pre")
		.all();
	const seenExamples = new Set<string>();
	let demoCount = 1;

	// Try to find variant names from headings
	const headings = await page.locator("h1, h2, h3, h4").allTextContents();
	const variantHeadings = headings.filter(
		(h) =>
			h.toLowerCase().includes("variant") ||
			h.toLowerCase().includes("example") ||
			h.toLowerCase().includes("demo"),
	);

	for (const block of codeBlocks) {
		try {
			const code = await block.textContent();
			if (code) {
				const cleanCode = code
					.replace(/^```.*\n/, "")
					.replace(/```$/, "")
					.trim();

				if (cleanCode.includes("npx shadcn") || cleanCode.includes("npm i ")) {
					installInstructions.push({
						title: "Installation",
						code: cleanCode,
					});
				} else if (
					(cleanCode.includes("import") || cleanCode.includes("export")) &&
					!seenExamples.has(cleanCode)
				) {
					// Try to find a matching variant heading
					const nearestHeading = variantHeadings.find((h) =>
						h.toLowerCase().includes(cleanCode.slice(0, 20).toLowerCase()),
					);

					const variant = nearestHeading
						? nearestHeading
							.toLowerCase()
							.replace(/variant|example|demo/g, "")
							.replace(/[^a-z0-9]+/g, "-")
							.replace(/^-+|-+$/g, "")
							.trim()
						: `demo-${String(demoCount++).padStart(2, "0")}`;

					examples.push({
						title: variant,
						code: cleanCode,
						variant,
					});
					seenExamples.add(cleanCode);
				}
			}
		} catch (error) {
			console.log("Error getting code block:", error);
		}
	}

	return { examples, installInstructions };
}

function createBlockConfig({
	slug,
	description,
	dependencies,
	name,
	tags,
	docsUrl,
	config,
	registryData,
}: {
	slug: string;
	description: string;
	dependencies: { core: string[]; component: string[] };
	name: string;
	tags: string[];
	docsUrl: string;
	config: ScraperConfig;
	registryData: { component?: RegistryComponent; demo?: RegistryDemo };
}) {
	const allDeps = new Set([
		...dependencies.core,
		...dependencies.component,
		...(config.defaultDependencies || []),
	]);

	const componentFileName =
		(config.fileStructure?.componentFileName || "[slug]").replace(
			"[slug]",
			slug,
		) + (config.fileStructure?.componentFileExt || ".tsx");

	return {
		name: slug,
		type: registryData.component?.type || "registry:block",
		description,
		dependencies: Array.from(allDeps),
		registryDependencies: [
			...(registryData.component?.registryDependencies || []),
			...(registryData.demo?.registryDependencies || []),
		],
		categories: config.categories || ["components", "ui"],
		style: config.style,
		tags,
		version: config.defaultVersion || "1.0.0",
		author: config.author,
		license: config.license,
		repository: config.repository,
		docsUrl,
		files: [
			{
				source: componentFileName,
				type:
					registryData.component?.files[0]?.type ||
					config.fileStructure?.componentType ||
					"registry:component",
			},
		],
	};
}

function createFiles({
	slug,
	fullCode,
	blockConfig,
	examples,
	installInstructions,
	config,
}: {
	slug: string;
	fullCode: string;
	blockConfig: any;
	examples: ComponentExample[];
	installInstructions: ComponentExample[];
	config: ScraperConfig;
}): ComponentFile[] {
	const {
		rootDir = "ui",
		metaFileName = "meta.ts",
		configFileName = "block.config.json",
		variantSeparator = "-",
		componentFileName = "[slug]",
		componentFileExt = ".tsx",
	} = config.fileStructure || {};

	const resolvedComponentFileName =
		componentFileName.replace("[slug]", slug) + componentFileExt;

	const files: ComponentFile[] = [
		{
			path: path.join(slug, resolvedComponentFileName),
			content: fullCode,
			type: "component",
		},
		{
			path: path.join(slug, configFileName),
			content: JSON.stringify(blockConfig, null, 2),
			type: "component",
		},
		{
			path: path.join(slug, metaFileName),
			content: `export default ${JSON.stringify(
				{
					meta: {
						category: "UI Components",
						tags: blockConfig.tags,
						status: config.defaultStatus || "stable",
						version: blockConfig.version,
						author: blockConfig.author,
						description: blockConfig.description,
						repository: blockConfig.repository,
						license: blockConfig.license,
						docsUrl: blockConfig.docsUrl,
					},
					examples,
					installInstructions,
				},
				null,
				2,
			)};`,
			type: "component",
		},
	];

	for (const example of examples) {
		const variantFileName = `${slug}${variantSeparator}${example.variant}${componentFileExt}`;
		files.push({
			path: path.join(slug, variantFileName),
			content: example.code,
			type: "component",
		});
	}

	return files;
}

async function scrapeComponents(config: Partial<ScraperConfig> = {}) {
	const finalConfig: ScraperConfig = {
		...DEFAULT_CONFIG,
		...config,
		selectors: {
			...DEFAULT_CONFIG.selectors,
			...(config.selectors || {}),
		},
		browserOptions: {
			...DEFAULT_CONFIG.browserOptions,
			...(config.browserOptions || {}),
		},
		fileStructure: {
			...DEFAULT_CONFIG.fileStructure,
			...(config.fileStructure || {}),
		},
	};

	try {
		console.log("\n📁 Output directory:", finalConfig.outputDir);
		console.log("🧹 Clearing output directory...");
		removeDirectory(finalConfig.outputDir);
		fs.mkdirSync(finalConfig.outputDir, { recursive: true });

		console.log("\n🔍 Getting components list...");
		const components = await getComponentsList(finalConfig);

		const componentsListPath = path.join(
			finalConfig.outputDir,
			finalConfig.style || "default",
			finalConfig.fileStructure?.rootDir || "ui",
			finalConfig.fileStructure?.componentsFile || "components.json",
		);
		const relativeComponentsPath = path.relative(
			process.cwd(),
			componentsListPath,
		);
		console.log(`📝 Writing components list to ${relativeComponentsPath}`);
		fs.mkdirSync(path.dirname(componentsListPath), { recursive: true });
		fs.writeFileSync(componentsListPath, JSON.stringify(components, null, 2));
		console.log(`✨ Found ${components.length} components`);

		let completed = 0;
		let failed = 0;
		const total = components.length;

		for (const componentInfo of components) {
			completed++;
			const progress = ((completed / total) * 100).toFixed(1);
			console.log(
				`\n📦 Processing component ${completed}/${total} (${progress}%)`,
			);
			console.log(`🔧 Component: ${componentInfo.name}`);

			try {
				const component = await scrapeComponent(
					`${finalConfig.baseUrl}${componentInfo.url}`,
					finalConfig,
				);

				console.log("\n💾 Writing component files...");
				for (const file of component.files) {
					const filePath = path.join(
						finalConfig.outputDir,
						finalConfig.style || "default",
						finalConfig.fileStructure?.rootDir || "ui",
						file.path,
					);
					const relativeFilePath = path.relative(process.cwd(), filePath);
					console.log(`  ↪ Writing ${relativeFilePath}`);
					fs.mkdirSync(path.dirname(filePath), { recursive: true });
					fs.writeFileSync(filePath, file.content);
				}
				console.log("✅ Component completed successfully!");
			} catch (error) {
				console.error(
					`❌ Failed to process component ${componentInfo.name}:`,
					error,
				);
				failed++;
			}
		}

		console.log("\n🎉 Scraping completed!");
		console.log(
			`✅ Successfully processed ${completed - failed}/${total} components`,
		);
		if (failed > 0) {
			console.log(`❌ Failed to process ${failed} components`);
		}
	} catch (error) {
		console.error("❌ Failed to scrape components:", error);
		throw error;
	}
}

// Example usage with custom configuration:
scrapeComponents({
	// Example of customizing the configuration
	// baseUrl: "https://other-ui-library.com",
	// outputDir: "different/output/dir",
	// browserOptions: {
	//   timeout: 180000,
	//   retries: 5,
	// },
	// fileStructure: {
	//   blocksDir: "custom-blocks",
	//   previewPrefix: "example-",
	// },
}).catch(console.error);
