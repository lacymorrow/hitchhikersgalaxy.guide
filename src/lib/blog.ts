import fs from "fs/promises";
import matter from "gray-matter";
import path from "path";

export interface BlogPost {
	title: string;
	slug: string;
	content: string;
	description?: string;
	author?: string;
	publishedAt?: string;
	categories?: string[];
}

export interface BlogCategory {
	name: string;
	posts: BlogPost[];
}

export async function getBlogPosts(): Promise<BlogPost[]> {
	const postsDirectory = path.join(process.cwd(), "src/content/blog");
	const filenames = await fs.readdir(postsDirectory);

	const posts = await Promise.all(
		filenames.map(async (filename) => {
			const filePath = path.join(postsDirectory, filename);
			const fileContent = await fs.readFile(filePath, "utf-8");
			const { data, content } = matter(fileContent);
			return {
				title: data.title,
				slug: filename.replace(/\.mdx$/, ""),
				content,
				description: data.description,
				author: data.author,
				publishedAt: data.publishedAt,
				categories: data.categories || [],
			};
		}),
	);

	return posts;
}

export function getBlogCategories(posts: BlogPost[]): BlogCategory[] {
	const categoriesMap = new Map<string, BlogPost[]>();

	// Add uncategorized first to ensure it's at the top
	categoriesMap.set("Uncategorized", []);

	// Group posts by category
	for (const post of posts) {
		if (!post.categories?.length) {
			const uncategorized = categoriesMap.get("Uncategorized") || [];
			uncategorized.push(post);
			categoriesMap.set("Uncategorized", uncategorized);
		} else {
			for (const category of post.categories) {
				const categoryPosts = categoriesMap.get(category) || [];
				categoryPosts.push(post);
				categoriesMap.set(category, categoryPosts);
			}
		}
	}

	// Convert map to array and sort categories alphabetically
	// keeping Uncategorized at the top if it has posts
	return Array.from(categoriesMap.entries())
		.filter(([_, posts]) => posts.length > 0)
		.map(([name, posts]) => ({
			name,
			posts: posts.sort((a, b) => {
				if (!a.publishedAt || !b.publishedAt) return 0;
				return (
					new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
				);
			}),
		}))
		.sort((a, b) => {
			if (a.name === "Uncategorized") return -1;
			if (b.name === "Uncategorized") return 1;
			return a.name.localeCompare(b.name);
		});
}
