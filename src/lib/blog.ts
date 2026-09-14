import fs from "node:fs/promises";
import path from "node:path";
import {
  type BlogAuthor,
  convertLegacyAuthor,
  defaultAuthor,
  getAuthorById,
} from "@/config/blog-authors";
import { blogManifest } from "@/lib/generated/blog-manifest";

export interface BlogPost {
  title: string;
  slug: string;
  content: string;
  description?: string;
  author?: string; // Legacy field for backward compatibility
  authorObject?: BlogAuthor; // New structured author object
  publishedAt?: string;
  categories?: string[];
  badge?: string;
  authors?: { name: string; avatar: string }[]; // Legacy field
  authorObjects?: BlogAuthor[]; // New structured author objects
  image?: string;
}

export interface BlogCategory {
  name: string;
  posts: BlogPost[];
}

function resolveAuthors(data: Record<string, unknown>) {
  let authorObject: BlogAuthor | undefined;
  let authorObjects: BlogAuthor[] | undefined;

  if (data.author) {
    authorObject = convertLegacyAuthor(data.author as string);
  }
  if (data.authors && Array.isArray(data.authors)) {
    authorObjects = (data.authors as (string | { name?: string })[]).map((author) => {
      if (typeof author === "string") return convertLegacyAuthor(author);
      if (author.name) return convertLegacyAuthor(author.name);
      return defaultAuthor;
    });
  }
  if (data.authorId) {
    authorObject = getAuthorById(data.authorId as string);
  }
  if (data.authorIds && Array.isArray(data.authorIds)) {
    authorObjects = (data.authorIds as string[]).map((id) => getAuthorById(id));
  }
  return { authorObject, authorObjects };
}

function sortByDate(posts: BlogPost[]): BlogPost[] {
  return posts.sort((a, b) => {
    if (!a.publishedAt || !b.publishedAt) return 0;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (blogManifest.length > 0) {
    const posts = blogManifest.map((entry) => {
      const data = entry.frontmatter;
      const { authorObject, authorObjects } = resolveAuthors(data);
      return {
        title: data.title as string,
        slug: entry.filename.replace(/\.mdx?$/, ""),
        content: entry.content,
        description: data.description as string | undefined,
        author: data.author as string | undefined,
        authorObject,
        publishedAt: data.publishedAt as string | undefined,
        categories: (data.categories as string[]) || [],
        badge: data.badge as string | undefined,
        authors: data.authors as { name: string; avatar: string }[] | undefined,
        authorObjects,
        image: data.image as string | undefined,
      };
    });
    return sortByDate(posts);
  }

  const postsDirectory = path.join(process.cwd(), "src/content/blog");
  const filenames = await fs.readdir(postsDirectory);
  const { default: matter } = await import("gray-matter");

  const posts = await Promise.all(
    filenames.map(async (filename) => {
      const filePath = path.join(postsDirectory, filename);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const { data, content } = matter(fileContent);
      const { authorObject, authorObjects } = resolveAuthors(data);

      return {
        title: data.title,
        slug: filename.replace(/\.mdx$/, ""),
        content,
        description: data.description,
        author: data.author,
        authorObject,
        publishedAt: data.publishedAt,
        categories: data.categories ?? [],
        badge: data.badge,
        authors: data.authors,
        authorObjects,
        image: data.image,
      };
    })
  );

  return sortByDate(posts);
}

export function getBlogCategories(posts: BlogPost[]): BlogCategory[] {
  const categoriesMap = new Map<string, BlogPost[]>();

  // Add uncategorized first to ensure it's at the top
  categoriesMap.set("Uncategorized", []);

  // Group posts by category
  for (const post of posts) {
    if (!post.categories?.length) {
      const uncategorized = categoriesMap.get("Uncategorized") ?? [];
      uncategorized.push(post);
      categoriesMap.set("Uncategorized", uncategorized);
    } else {
      for (const category of post.categories) {
        const categoryPosts = categoriesMap.get(category) ?? [];
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
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }),
    }))
    .sort((a, b) => {
      if (a.name === "Uncategorized") return -1;
      if (b.name === "Uncategorized") return 1;
      return a.name.localeCompare(b.name);
    });
}
