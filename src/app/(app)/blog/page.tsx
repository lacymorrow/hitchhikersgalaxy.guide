import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { constructMetadata } from "@/config/metadata";
import { type BlogPost, getBlogPosts } from "@/lib/blog";
import { formatDate } from "@/lib/utils/format-date";
import { FolderIcon } from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/components/primitives/link-with-transition";
import { Fragment } from "react";

export const metadata: Metadata = constructMetadata({
	title: "Blog - Latest Updates & Guides | Shipkit",
	description: "Stay up to date with the latest app development trends, tutorials, and best practices. Learn how to build better apps faster with Shipkit's expert guides and tips.",
});

const BlogPage = async () => {
	const posts: BlogPost[] = await getBlogPosts();
	const featuredPost = posts[0]; // Most recent post as featured
	const regularPosts = posts.slice(1);

	return (
		<div className="relative w-full">
			<div className="flex flex-col gap-8">
				{/* Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col gap-2">
						<h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">Blog</h1>
						<p className="text-xl text-muted-foreground leading-7">
							Latest news, updates and guides for Shipkit
						</p>
					</div>
					<Link
						href="/blog/categories"
						className={buttonVariants({ variant: "outline", size: "sm" })}
					>
						<FolderIcon className="mr-2 h-4 w-4" />
						View Categories
					</Link>
				</div>

				{/* Featured Post */}
				{featuredPost && (
					<section>
						<h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight mb-4">
							Featured Post
						</h2>
						<Card className="overflow-hidden hover:bg-muted/50 transition-colors">
							<CardHeader className="space-y-4">
								{featuredPost.categories && featuredPost.categories.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{featuredPost.categories.map((category) => (
											<Link
												key={category}
												href={`/blog/categories/${encodeURIComponent(category)}`}
												className={buttonVariants({ variant: "secondary", size: "sm" })}
											>
												{category}
											</Link>
										))}
									</div>
								)}
								<Link href={`/blog/${featuredPost.slug}`} className="group">
									<CardTitle className="text-2xl lg:text-3xl group-hover:underline">
										{featuredPost.title}
									</CardTitle>
									{featuredPost.description && (
										<CardDescription className="text-base lg:text-lg">
											{featuredPost.description}
										</CardDescription>
									)}
								</Link>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									{featuredPost.author && (
										<span className="font-medium text-foreground">
											{featuredPost.author}
										</span>
									)}
									{featuredPost.publishedAt && (
										<Fragment>
											<span>•</span>
											<time dateTime={featuredPost.publishedAt}>
												{formatDate(featuredPost.publishedAt)}
											</time>
										</Fragment>
									)}
								</div>
							</CardContent>
						</Card>
					</section>
				)}

				{/* Regular Posts Grid */}
				<section>
					<h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight mb-4">
						Latest Posts
					</h2>
					<div className="grid gap-6 sm:grid-cols-2">
						{regularPosts.map((post) => (
							<Card key={post.slug} className="h-full transition-colors hover:bg-muted/50">
								<CardHeader>
									{post.categories && post.categories.length > 0 && (
										<div className="flex flex-wrap gap-2 mb-2">
											{post.categories.map((category) => (
												<Link
													key={category}
													href={`/blog/categories/${encodeURIComponent(category)}`}
													className={buttonVariants({ variant: "secondary", size: "sm" })}
												>
													{category}
												</Link>
											))}
										</div>
									)}
									<Link href={`/blog/${post.slug}`} className="group">
										<CardTitle className="line-clamp-2 group-hover:underline">
											{post.title}
										</CardTitle>
										{post.description && (
											<CardDescription className="line-clamp-2">
												{post.description}
											</CardDescription>
										)}
									</Link>
								</CardHeader>
								<CardContent>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										{post.author && (
											<span className="font-medium text-foreground">
												{post.author}
											</span>
										)}
										{post.publishedAt && (
											<Fragment>
												<span>•</span>
												<time dateTime={post.publishedAt}>
													{formatDate(post.publishedAt)}
												</time>
											</Fragment>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</section>
			</div>
		</div>
	);
};

export default BlogPage;
