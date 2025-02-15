import { Header } from "@/components/headers/header";
import { BlogSidebar } from "@/components/layouts/blog-sidebar";
import MainLayout from "@/components/layouts/main-layout";
import { routes } from "@/config/routes";
import { getBlogPosts } from "@/lib/blog";
import type { ReactNode } from "react";

const blogNavLinks = [
	{ href: routes.faq, label: "Faqs", isCurrent: false },
	{ href: routes.features, label: "Features", isCurrent: false },
	{ href: routes.pricing, label: "Pricing", isCurrent: false },
	{ href: "/blog", label: "Blog", isCurrent: true },
];

export const BlogLayout = async ({ children }: { children: ReactNode }) => {
	const posts = await getBlogPosts();

	return (
		<MainLayout header={<Header navLinks={blogNavLinks} variant="sticky" />}>
			<div className="flex gap-4">
				<BlogSidebar posts={posts} />
				<div className="flex-1 p-4">{children}</div>
			</div>
		</MainLayout>
	);
};

export default BlogLayout;
