import { buttonVariants } from '@/components/ui/button';
import { constructMetadata } from "@/config/metadata";
import { getBlogPosts } from '@/lib/blog';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format-date';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
	params: Promise<{
		slug: string | string[];
	}>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const resolvedParams = await params;
	const slug = Array.isArray(resolvedParams.slug) ? resolvedParams.slug.join('/') : resolvedParams.slug;
	const posts = await getBlogPosts();
	const post = posts.find((post) => post.slug === slug);

	if (!post) {
		return constructMetadata({
			title: "Post Not Found | Shipkit Blog",
			description: "The blog post you're looking for could not be found. Browse our other articles for app development insights and guides.",
		});
	}

	return constructMetadata({
		title: `${post.title} | Shipkit Blog`,
		description: post.description || "Read this comprehensive guide on app development best practices, tips, and insights from the Shipkit team.",
		openGraph: {
			title: post.title,
			description: post.description,
			type: 'article',
			publishedTime: post.publishedAt,
			authors: post.author ? [post.author] : undefined,
		},
	});
}

const BlogPostPage = async ({ params }: Props) => {
	const resolvedParams = await params;
	const slug = Array.isArray(resolvedParams.slug) ? resolvedParams.slug.join('/') : resolvedParams.slug;
	const posts = await getBlogPosts();
	const post = posts.find((post) => post.slug === slug);

	if (!post) {
		notFound();
	}

	return (
		<article className="relative w-full">
			{/* Back button */}
			<Link
				href="/blog"
				className={cn(
					buttonVariants({ variant: "ghost", size: "sm" }),
					"mb-8 h-auto p-0 text-muted-foreground hover:text-foreground"
				)}
			>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Back to Blog
			</Link>

			<div className="mx-auto w-full min-w-0">
				{/* Header section */}
				<header className="flex flex-col gap-4 border-b pb-8 mb-8">
					<h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
						{post.title}
					</h1>
					{post.description && (
						<p className="text-xl text-muted-foreground leading-7">
							{post.description}
						</p>
					)}

					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							{post.author && (
								<span className="font-medium text-foreground">
									{post.author}
								</span>
							)}
							{post.publishedAt && (
								<>
									<span>•</span>
									<time dateTime={post.publishedAt}>
										{formatDate(post.publishedAt)}
									</time>
								</>
							)}
						</div>

						{post.categories && post.categories.length > 0 && (
							<div className="flex flex-wrap gap-2">
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
					</div>
				</header>

				{/* Content section */}
				<div className="prose prose-neutral dark:prose-invert max-w-none">
					<MDXRemote source={post.content} />
				</div>
			</div>
		</article>
	);
};

export default BlogPostPage;
