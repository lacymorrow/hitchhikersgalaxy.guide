import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import type { Buffer } from "buffer";
import { readdir, stat } from "fs/promises";
import type { MetadataRoute } from "next";
import { join } from "path";

interface ContentFile {
	slug: string;
	path: string;
}

// Utility function to get content files
async function getContentFiles(contentDir: string): Promise<ContentFile[]> {
	try {
		const fullPath = join(process.cwd(), "src/content", contentDir);
		const files = await readdir(fullPath, { recursive: true });
		return files
			.filter(
				(file: string | Buffer): file is string => typeof file === "string" && file.endsWith(".mdx")
			)
			.map((file: string) => ({
				slug: file.replace(/\.mdx$/, ""),
				path: join(fullPath, file),
			}));
	} catch (error) {
		console.error(`Error reading ${contentDir} directory:`, error);
		return [];
	}
}

// This function will be called at build time and can also be called on-demand
export async function generateSitemaps() {
	// Count the number of blog posts and docs to determine sitemap splitting
	const [blogFiles, docFiles] = await Promise.all([
		getContentFiles("blog"),
		getContentFiles("docs"),
	]);

	return [
		{ id: 0 }, // Static routes
		{ id: 1 }, // Blog posts
		{ id: 2 }, // Documentation
	];
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
	// Marketing pages (highest priority)
	const marketingRoutes = [
		{
			url: siteConfig.url,
			lastModified: new Date(),
			changeFrequency: "daily" as const,
			priority: 1,
		},
		{
			url: `${siteConfig.url}${routes.features}`,
			lastModified: new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.9,
		},
		{
			url: `${siteConfig.url}${routes.pricing}`,
			lastModified: new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.9,
		},
	];

	// Documentation pages (high priority)
	const docRoutes = [
		{
			url: `${siteConfig.url}${routes.docs}`,
			lastModified: new Date(),
			changeFrequency: "daily" as const,
			priority: 0.8,
		},
	];

	// Example pages (medium priority)
	const exampleRoutes = Object.values(routes.examples)
		.filter((route): route is string => typeof route === "string" && route !== routes.examples.root)
		.map((route) => ({
			url: `${siteConfig.url}${route}`,
			lastModified: new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.7,
		}));

	// Support pages (lower priority)
	const supportRoutes = [
		{
			url: `${siteConfig.url}${routes.faq}`,
			lastModified: new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.6,
		},
		{
			url: `${siteConfig.url}${routes.terms}`,
			lastModified: new Date(),
			changeFrequency: "monthly" as const,
			priority: 0.4,
		},
		{
			url: `${siteConfig.url}${routes.privacy}`,
			lastModified: new Date(),
			changeFrequency: "monthly" as const,
			priority: 0.4,
		},
	];

	// When we have dynamic routes, we can split them into multiple sitemaps
	// based on the id parameter
	switch (id) {
		case 0:
			// Main sitemap with static routes
			return [...marketingRoutes, ...docRoutes, ...exampleRoutes, ...supportRoutes];
		case 1: {
			// Blog posts sitemap
			const blogFiles = await getContentFiles("blog");
			const blogRoutes = await Promise.all(
				blogFiles.map(async (file) => {
					const stats = await stat(file.path);
					return {
						url: `${siteConfig.url}${routes.blog}/${file.slug}`,
						lastModified: stats.mtime,
						changeFrequency: "monthly" as const,
						priority: 0.6,
					};
				})
			);
			return blogRoutes;
		}
		case 2: {
			// Documentation pages sitemap
			const docFiles = await getContentFiles("docs");
			const docsRoutes = await Promise.all(
				docFiles.map(async (file) => {
					const stats = await stat(file.path);
					return {
						url: `${siteConfig.url}${routes.docs}/${file.slug}`,
						lastModified: stats.mtime,
						changeFrequency: "weekly" as const,
						priority: 0.7,
					};
				})
			);
			return docsRoutes;
		}
		default:
			return [];
	}
}
