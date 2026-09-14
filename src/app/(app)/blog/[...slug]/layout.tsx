import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getBlogPosts } from "@/lib/blog";

interface Props {
  children: ReactNode;
  params: Promise<{ slug: string[] }>;
}

/**
 * Existence check for /blog/[...slug].
 *
 * A layout renders above its segment's loading.tsx boundary, so notFound()
 * here settles the HTTP status before Next streams the shell. The page below
 * keeps its skeleton. Posts come from the build-time manifest, so the second
 * lookup in the page is free.
 */
export default async function BlogPostLayout({ children, params }: Props) {
  const { slug } = await params;
  const posts = await getBlogPosts();
  if (!posts.some((post) => post.slug === slug.join("/"))) notFound();
  return children;
}
