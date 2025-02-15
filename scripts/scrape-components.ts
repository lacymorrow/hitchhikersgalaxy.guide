import fs from "fs";
import path from "path";
import type { Page } from "playwright";
import { chromium } from "playwright";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SiteConfig {
	name: string;
	baseUrl: string;
	componentsPath: string;
	selectors: {
		componentLinks: string;
		componentTitle: string;
		componentDescription: string;
		codeBlocks: string;
		previewHeadings?: string;
		installationSection?: string;
		componentTags?: string;
	};
	outputDir: string;
	style?: string;
	author?: string;
	license?: string;
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
	transformers?: {
		componentName?: (name: string) => string;
		componentUrl?: (url: string) => string;
		codeBlock?: (code: string) => string;
	};
}

// Site-specific configurations
const SITE_CONFIGS: Record<string, SiteConfig> = {
	aceternity: {
		name: "aceternity",
		baseUrl: "https://ui.aceternity.com",
		componentsPath: "/components",
		outputDir: path.join(__dirname, "..", "src", "registry", "src", "aceternity"),
		style: "default",
		author: "mannupaaji",
		license: "MIT",
		selectors: {
			componentLinks: 'a[href^="/components/"]',
			componentTitle: 'h1[class*="text-4xl"]',
			componentDescription: 'h1[class*="text-4xl"] + p',
			componentTags: '.flex.gap-2.flex-wrap a[href^="/categories/"]',
			codeBlocks: "pre",
			previewHeadings: 'h2:has-text("Preview"), h3:has-text("Preview"), h4:has-text("Preview")',
		},
		browserOptions: {
			timeout: 120000,
			waitUntil: "networkidle",
			retries: 3,
			retryDelay: 1000,
		},
	},
	magicui: {
		name: "magicui",
		baseUrl: "https://magicui.design",
		componentsPath: "/docs/components",
		outputDir: path.join(__dirname, "..", "src", "registry", "src", "magicui"),
		style: "default",
		author: "Magic UI",
		license: "MIT",
		selectors: {
			componentLinks: 'a[href^="/docs/components/"]',
			componentTitle: "h1",
			componentDescription: "h1 + p",
			codeBlocks: "pre",
			installationSection: 'h2:has-text("Installation")',
		},
		browserOptions: {
			timeout: 120000,
			waitUntil: "networkidle",
			retries: 3,
			retryDelay: 1000,
		},
	},
	cultui: {
		name: "cultui",
		baseUrl: "https://www.cult-ui.com",
		componentsPath: "/docs/components",
		outputDir: path.join(__dirname, "..", "src", "registry", "src", "cultui"),
		style: "default",
		author: "Cult UI",
		license: "MIT",
		selectors: {
			componentLinks: 'a[href^="/docs/components/"]',
			componentTitle: "h1",
			componentDescription: "h1 + p",
			codeBlocks: "pre",
			installationSection: 'h2:has-text("Installation")',
		},
		browserOptions: {
			timeout: 120000,
			waitUntil: "networkidle",
			retries: 3,
			retryDelay: 1000,
		},
	},
};

interface ComponentInfo {
	name: string;
	slug: string;
	description: string;
	docsUrl: string;
	code: string;
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

async function getComponentsList(config: SiteConfig): Promise<{ name: string; url: string; description: string }[]> {
	const browser = await chromium.launch({ headless: true }); // Run in headless mode
	const page = await browser.newPage();

	try {
		const url = `${config.baseUrl}${config.componentsPath}`;
		console.log(`Navigating to ${url} to get components list...`);

		await page.goto(url, {
			waitUntil: config.browserOptions?.waitUntil || "domcontentloaded",
			timeout: config.browserOptions?.timeout || 30000,
		});

		// Wait for the components to be loaded
		await page.waitForSelector(config.selectors.componentLinks, { timeout: 30000 });

		const components = await page.evaluate((selector: string) => {
			console.log(`Looking for components with selector: ${selector}`);
			const links = Array.from(document.querySelectorAll(selector));
			console.log(`Found ${links.length} components`);

			return links.map((link) => {
				const container = link.closest("div");
				const description = container?.querySelector("p")?.textContent || "";
				const name = link.textContent?.replace(/New$/, "").trim() || "";
				const url = link.getAttribute("href") || "";

				console.log(`Component found: ${name} (${url})`);
				return { name, url, description };
			});
		}, config.selectors.componentLinks);

		console.log('Components found:', components);
		await browser.close();
		return components;
	} catch (error) {
		console.error(`Error getting components list for ${config.name}:`, error);
		// Take a screenshot for debugging
		await page.screenshot({ path: 'error-screenshot.png' });
		await browser.close();
		throw error;
	}
}

async function scrapeComponent(url: string, config: SiteConfig): Promise<ComponentInfo> {
	const retries = config.browserOptions?.retries || 3;
	const retryDelay = config.browserOptions?.retryDelay || 1000;

	for (let attempt = 1; attempt <= retries; attempt++) {
		const browser = await chromium.launch({
			timeout: config.browserOptions?.timeout,
			headless: true, // Run in headless mode
		});
		const page = await browser.newPage();

		try {
			console.log(`Navigating to ${url}... (attempt ${attempt}/${retries})`);
			await page.goto(url, {
				timeout: config.browserOptions?.timeout,
				waitUntil: config.browserOptions?.waitUntil,
			});

			// Wait for the content to be loaded
			await page.waitForSelector(config.selectors.componentTitle, { timeout: 30000 });

			// Extract basic component information
			const name = await page.$eval(config.selectors.componentTitle, (el) => {
				console.log(`Found title: ${el.textContent}`);
				return el.textContent?.trim() || "";
			});

			const description = await page.$eval(
				config.selectors.componentDescription,
				(el) => {
					console.log(`Found description: ${el.textContent}`);
					return el.textContent?.trim() || "";
				},
			);

			// Extract code blocks and dependencies
			const { mainComponentCode, dependencies } = await extractCodeAndDependencies(page);

			// Extract examples
			const examples = await extractExamples(page, config);

			// Create component info
			const componentInfo: ComponentInfo = {
				name,
				slug: url.split("/").pop() || "",
				description,
				docsUrl: url,
				code: mainComponentCode,
				dependencies,
				files: [],
				examples,
			};

			console.log('Successfully scraped component:', componentInfo);
			await browser.close();
			return componentInfo;
		} catch (error) {
			await page.screenshot({ path: `error-screenshot-${attempt}.png` });
			await browser.close();
			console.error(`Error scraping component (attempt ${attempt}/${retries}):`, error);
			if (attempt === retries) throw error;
			await new Promise((resolve) => setTimeout(resolve, retryDelay));
		}
	}

	throw new Error("Failed to scrape component after all retries");
}

async function extractCodeAndDependencies(page: Page): Promise<{
	mainComponentCode: string;
	dependencies: { core: string[]; component: string[] };
}> {
	// Wait for all iframes to load
	await page.waitForLoadState('networkidle');

	// Try to find and click the Manual tab
	try {
		const manualTab = await page.getByRole('tab', { name: 'Manual' });
		if (await manualTab.isVisible()) {
			await manualTab.click();
			// Wait a bit for the content to load
			await page.waitForTimeout(500);
		}
	} catch (e) {
		console.log('Manual tab not found or not clickable, continuing with other tabs');
	}

	// Get all frames including the main page
	const frames = page.frames();

	// Extract code blocks from all frames
	const codeBlocks = await Promise.all(
		frames.map(async (frame) => {
			try {
				// Look for code blocks in pre elements and Monaco editor
				const blocks = await frame.evaluate(() => {
					const codeBlocks: string[] = [];

					// Check Monaco editor content
					const monacoEditors = document.querySelectorAll('.monaco-editor');
					for (const editor of monacoEditors) {
						const content = editor.querySelector('.view-lines')?.textContent;
						if (content) codeBlocks.push(content);
					}

					// Check pre elements with specific language tags
					const preElements = document.querySelectorAll('pre[class*="language-"], pre[data-language], [data-rehype-pretty-code-fragment] pre');
					for (const pre of preElements) {
						const content = pre.textContent;
						if (content) codeBlocks.push(content);
					}

					// Check for code inside iframes with specific class names
					const frameElements = document.querySelectorAll('.frame-content, .preview-frame');
					for (const frame of frameElements) {
						const content = frame.textContent;
						if (content) codeBlocks.push(content);
					}

					// Check for code in data-rehype-pretty-code-fragment
					const codeFragments = document.querySelectorAll('[data-rehype-pretty-code-fragment] code');
					for (const fragment of codeFragments) {
						const content = fragment.textContent;
						if (content) codeBlocks.push(content);
					}

					// Check for code in copy buttons
					const copyButtons = document.querySelectorAll('button[data-copy-code]');
					for (const button of copyButtons) {
						const content = button.getAttribute('data-copy-code');
						if (content) codeBlocks.push(content);
					}

					return codeBlocks;
				});
				return blocks;
			} catch (e) {
				console.error('Error extracting code blocks from frame:', e);
				return [];
			}
		})
	);

	// Flatten and filter code blocks
	const allCodeBlocks = codeBlocks.flat().filter(Boolean);

	// First try to find the component code in the Manual tab
	let mainComponentCode = '';
	const manualCode = allCodeBlocks.find(block => {
		const isTypeScript = block.includes('interface') || block.includes('type');
		const isComponent = block.includes('export') && (block.includes('function') || block.includes('=>'));
		const hasProps = block.includes('Props');
		const isMainComponent = block.includes('use client') || block.includes('import');
		const isNotDemo = !block.toLowerCase().includes('demo');
		const hasAnimation = block.includes('@keyframes') || block.includes('animation') || block.includes('transition');
		const isInManualTab = block.includes('Props') || block.includes('interface') || block.includes('type');
		const hasFullImplementation = block.includes('className') || block.includes('style') || block.includes('ref');
		return (isTypeScript && isComponent && hasProps && isMainComponent && isNotDemo && (isInManualTab || hasFullImplementation)) || hasAnimation;
	});

	if (manualCode) {
		mainComponentCode = manualCode;
	} else {
		// If not found in Manual tab, try other tabs
		mainComponentCode = allCodeBlocks.find(block => {
			const isTypeScript = block.includes('interface') || block.includes('type');
			const isComponent = block.includes('export') && (block.includes('function') || block.includes('=>'));
			const hasProps = block.includes('Props');
			const isMainComponent = block.includes('use client') || block.includes('import');
			const isNotDemo = !block.toLowerCase().includes('demo');
			const hasAnimation = block.includes('@keyframes') || block.includes('animation') || block.includes('transition');
			const hasFullImplementation = block.includes('className') || block.includes('style') || block.includes('ref');
			return (isTypeScript && isComponent && hasProps && isMainComponent && isNotDemo && hasFullImplementation) || hasAnimation;
		}) || '';
	}

	// If we still don't have the full implementation, try to find it in any code block
	if (!mainComponentCode.includes('className') && !mainComponentCode.includes('style')) {
		const fullImplementation = allCodeBlocks.find(block => {
			const isComponent = block.includes('export') && (block.includes('function') || block.includes('=>'));
			const hasProps = block.includes('Props');
			const hasFullImplementation = block.includes('className') || block.includes('style') || block.includes('ref');
			const isNotDemo = !block.toLowerCase().includes('demo');
			return isComponent && hasProps && hasFullImplementation && isNotDemo;
		});
		if (fullImplementation) {
			mainComponentCode = fullImplementation;
		}
	}

	// Extract dependencies
	const dependencies = await page.evaluate(() => {
		const deps = {
			core: [] as string[],
			component: [] as string[],
		};

		// Find all code blocks that might contain dependencies
		const installBlocks = Array.from(document.querySelectorAll('pre, code, [data-rehype-pretty-code-fragment]')).filter(el =>
			el.textContent?.includes('npm i') ||
			el.textContent?.includes('pnpm add') ||
			el.textContent?.includes('yarn add') ||
			el.textContent?.includes('npx shadcn') ||
			el.textContent?.includes('import')
		);

		for (const block of installBlocks) {
			const text = block.textContent || '';

			// Extract package manager commands
			const packageManagerMatches = text.match(/(?:npm i|pnpm add|yarn add|npx shadcn(?:-ui)?@latest add)\s+([^"\n]+)/g);
			if (packageManagerMatches) {
				for (const match of packageManagerMatches) {
					const packages = match.split(/\s+/).slice(2);
					if (text.includes('three') || text.includes('@react-three')) {
						deps.component.push(...packages);
					} else {
						deps.core.push(...packages);
					}
				}
			}

			// Extract from import statements
			const importMatches = text.match(/import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g);
			if (importMatches) {
				for (const match of importMatches) {
					const packageName = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
					if (packageName && !packageName.startsWith('.') && !packageName.startsWith('@/')) {
						if (packageName.includes('three') || packageName.includes('@react-three')) {
							deps.component.push(packageName);
						} else {
							deps.core.push(packageName);
						}
					}
				}
			}
		}

		// Remove duplicates and sort
		deps.core = [...new Set(deps.core)].sort();
		deps.component = [...new Set(deps.component)].sort();

		return deps;
	});

	return {
		mainComponentCode: mainComponentCode.trim(),
		dependencies,
	};
}

async function extractExamples(page: Page, config: SiteConfig) {
	console.log("Getting examples...");
	const examples: ComponentExample[] = [];

	// Try to click any code tabs
	const codeTabs = await page.locator('button:has-text("Code"), button:has-text("Manual")').all();
	for (const tab of codeTabs) {
		await tab.click().catch(() => { }); // Ignore click errors
		await page.waitForTimeout(500); // Give more time for content to load
	}

	const codeBlocks = await page.locator("[data-rehype-pretty-code-fragment] pre, pre").all();
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

				// Skip installation commands
				if (cleanCode.includes("npx shadcn") || cleanCode.includes("npm i ")) {
					continue;
				}

				// Skip if this is the main component implementation
				if (cleanCode.includes("interface") && cleanCode.includes("Props") && !cleanCode.toLowerCase().includes("demo")) {
					continue;
				}

				// Skip if this is a Tailwind config
				if (cleanCode.includes("@type {import('tailwindcss').Config}")) {
					continue;
				}

				// Skip if we've seen this example before
				const normalizedCode = cleanCode.replace(/\s+/g, ' ').trim();
				if (seenExamples.has(normalizedCode)) {
					continue;
				}

				// Only include code that looks like a demo
				if (
					(cleanCode.includes("import") || cleanCode.includes("export")) &&
					cleanCode.toLowerCase().includes("demo")
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
					seenExamples.add(normalizedCode);
				}
			}
		} catch (error) {
			console.log("Error getting code block:", error);
		}
	}

	return examples;
}

async function generateComponentFiles(componentInfo: ComponentInfo, config: SiteConfig) {
	const componentDir = path.join(config.outputDir, componentInfo.slug);

	// Create the component directory
	if (!fs.existsSync(componentDir)) {
		fs.mkdirSync(componentDir, { recursive: true });
	}

	// Generate component.json with just the main component
	const componentJson = {
		$schema: "https://ui.shadcn.com/schema.json",
		name: componentInfo.slug,
		type: "registry:ui",
		author: config.author,
		dependencies: [
			...componentInfo.dependencies.core,
			...componentInfo.dependencies.component,
		],
		files: [
			{
				name: componentInfo.slug,
				path: `${componentInfo.slug}.tsx`,
				content: componentInfo.code,
			},
		],
	};

	await fs.promises.writeFile(
		path.join(componentDir, "component.json"),
		JSON.stringify(componentJson, null, 2),
		'utf-8'
	);

	// Generate component-demo.json with just the demos
	const componentDemoJson = {
		name: componentInfo.slug,
		description: componentInfo.description,
		demos: componentInfo.examples.map((example) => ({
			name: example.variant,
			path: `${example.variant}.tsx`,
			content: example.code,
		})),
	};

	await fs.promises.writeFile(
		path.join(componentDir, "component-demo.json"),
		JSON.stringify(componentDemoJson, null, 2),
		'utf-8'
	);

	// Generate the main component file using the extracted code
	const mainComponentContent = componentInfo.code || `"use client";

import * as React from "react";

interface ${componentInfo.name.replace(/\s+/g, '')}Props {
	children?: React.ReactNode;
}

export function ${componentInfo.name.replace(/\s+/g, '')}({
	children,
	...props
}: ${componentInfo.name.replace(/\s+/g, '')}Props) {
	return (
		<div {...props}>
			{children}
		</div>
	);
}`;

	fs.writeFileSync(
		path.join(componentDir, `${componentInfo.slug}.tsx`),
		mainComponentContent
	);

	// Generate demo files for each example
	for (const example of componentInfo.examples) {
		fs.writeFileSync(
			path.join(componentDir, `${example.variant}.tsx`),
			example.code
		);
	}

	// Save block config with Tailwind animations
	const blockConfig = {
		style: "default",
		title: componentInfo.slug,
		description: componentInfo.description,
		author: config.author,
		license: "MIT",
		tags: ["ui", "components", "magicui"],
		type: "component",
		version: "1.0.0",
		install: config.name === "magicui"
			? `npx shadcn@latest add "https://magicui.design/r/${componentInfo.slug}"`
			: undefined,
		tailwind: {
			animations: {
				marquee: {
					"0%": { transform: "translateX(0)" },
					"100%": { transform: "translateX(calc(-100% - var(--gap)))" }
				},
				"marquee-vertical": {
					"0%": { transform: "translateY(0)" },
					"100%": { transform: "translateY(calc(-100% - var(--gap)))" }
				}
			}
		},
		files: componentInfo.examples.map((example) => ({
			name: example.variant,
			content: example.code,
		})),
	};

	await fs.promises.writeFile(
		path.join(componentDir, "block.config.json"),
		JSON.stringify(blockConfig, null, 2)
	);
}

async function cleanOutputDirectory(config: SiteConfig) {
	console.log(`Cleaning output directory: ${config.outputDir}`);
	if (fs.existsSync(config.outputDir)) {
		fs.rmSync(config.outputDir, { recursive: true });
	}
	fs.mkdirSync(config.outputDir, { recursive: true });
}

async function scrapeComponents(siteName: keyof typeof SITE_CONFIGS) {
	const config = SITE_CONFIGS[siteName];
	if (!config) {
		throw new Error(`No configuration found for site: ${siteName}`);
	}

	console.log(`Starting scrape for ${config.name}...`);

	try {
		// Clean output directory before starting
		await cleanOutputDirectory(config);

		// Get list of components
		const components = await getComponentsList(config);
		console.log(`Found ${components.length} components`);

		// Scrape each component
		for (const component of components) {
			try {
				console.log(`Scraping ${component.name}...`);
				const componentInfo = await scrapeComponent(
					component.url.startsWith("http") ? component.url : `${config.baseUrl}${component.url}`,
					config,
				);

				// Generate component files
				await generateComponentFiles(componentInfo, config);

				console.log(`✅ Scraped and generated files for ${component.name}`);
			} catch (error) {
				console.error(`❌ Failed to scrape ${component.name}:`, error);
			}
		}

		console.log(`Finished scraping ${config.name}`);
	} catch (error) {
		console.error(`Failed to scrape ${config.name}:`, error);
		throw error;
	}
}

// Example usage:
console.log("Starting scraping process...");
scrapeComponents("magicui").catch(error => {
	console.error("Failed to scrape components:", error);
	process.exit(1);
});
// scrapeComponents("aceternity");
// scrapeComponents("cultui");

export { scrapeComponents, SITE_CONFIGS };
