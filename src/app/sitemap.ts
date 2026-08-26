import type { Buffer } from "buffer";
import { readdir, stat } from "fs/promises";
import type { MetadataRoute } from "next";
import { join } from "path";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { db } from "@/server/db";
import { guideEntries } from "@/server/db/schema";

interface ContentFile {
  slug: string;
  path: string;
}

// Utility function to get content files
async function getContentFiles(contentDir: string): Promise<ContentFile[]> {
  try {
    let fullPath: string;

    // Docs are in root docs/ directory, other content is in src/content/
    if (contentDir === "docs") {
      fullPath = join(process.cwd(), "docs");
    } else {
      fullPath = join(process.cwd(), "src/content", contentDir);
    }

    const files = await readdir(fullPath, { recursive: true });
    return files
      .filter(
        (file: string | Buffer): file is string =>
          typeof file === "string" && (file.endsWith(".mdx") || file.endsWith(".md"))
      )
      .map((file: string) => ({
        slug: file.replace(/\.(mdx|md)$/, ""),
        path: join(fullPath, file),
      }));
  } catch (error) {
    console.error(`Error reading ${contentDir} directory:`, error);
    return [];
  }
}

// Get all guide entries from the database for sitemap
async function getGuideEntries() {
  try {
    if (!db) return [];
    const entries = await db.select({
      searchTerm: guideEntries.searchTerm,
      updatedAt: guideEntries.updatedAt,
    }).from(guideEntries);
    return entries;
  } catch (error) {
    console.error("Error fetching guide entries for sitemap:", error);
    return [];
  }
}

/*
 * Single sitemap served at /sitemap.xml (where robots.txt points).
 *
 * This previously used `generateSitemaps` to shard into /sitemap/[id].xml,
 * which left /sitemap.xml falling through to the guide catch-all route as an
 * HTML page (Ahrefs: "Sitemap in the wrong format"), and the shards themselves
 * rendered empty in production because the id arrived as a string and never
 * matched the numeric switch cases. At ~50 URLs, sharding is unnecessary
 * (the sitemap protocol allows 50,000 URLs per file).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // Static guide pages + support pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/popular`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/travel-guide`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/submit`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/terms-of-service`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  // Dynamic guide entries from database
  const entries = await getGuideEntries();
  const entryPages: MetadataRoute.Sitemap = entries.map((entry) => ({
    url: `${baseUrl}/${encodeURIComponent(entry.searchTerm)}`,
    lastModified: entry.updatedAt ?? new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Blog posts + docs (only when blog is enabled)
  const contentPages: MetadataRoute.Sitemap = [];
  if (process.env.NEXT_PUBLIC_HAS_BLOG === "true") {
    const blogFiles = await getContentFiles("blog");
    contentPages.push(
      ...(await Promise.all(
        blogFiles.map(async (file) => {
          const stats = await stat(file.path);
          return {
            url: `${baseUrl}${routes.blog}/${file.slug}`,
            lastModified: stats.mtime,
            changeFrequency: "monthly" as const,
            priority: 0.6,
          };
        })
      ))
    );
    const docFiles = await getContentFiles("docs");
    contentPages.push(
      ...(await Promise.all(
        docFiles.map(async (file) => {
          const stats = await stat(file.path);
          return {
            url: `${baseUrl}${routes.docs}/${file.slug}`,
            lastModified: stats.mtime,
            changeFrequency: "weekly" as const,
            priority: 0.7,
          };
        })
      ))
    );
  }

  return [...staticPages, ...entryPages, ...contentPages];
}
