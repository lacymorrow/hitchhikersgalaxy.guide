import type { ReactNode } from "react";
import { Header } from "@/components/headers/header";
import { BlogSidebar } from "@/components/layouts/blog-sidebar";
import { BlogHero } from "@/components/modules/blog/hero";
import { getBlogPosts } from "@/lib/blog";
import "@/styles/blog.css";

export default async function BlogLayout({ children }: { children: ReactNode }) {
  const posts = await getBlogPosts();

  return (
    <main className="min-h-screen relative">
      <Header variant="minimal" />
      <BlogHero />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:gap-6">
          <BlogSidebar posts={posts} />
          <section className="flex-1 min-w-0 w-full lg:w-auto py-4">{children}</section>
        </div>
      </div>
    </main>
  );
}
