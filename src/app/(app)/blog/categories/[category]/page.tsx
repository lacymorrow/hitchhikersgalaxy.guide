import { Badge } from "@/components/ui/badge";
import { getBlogCategories, getBlogPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { Link } from "@/components/primitives/link-with-transition"; // Add this line

export default async function CategoryPage({ searchParams }: { searchParams: Promise<{ category: string }> }) {
	const resolvedParams = await searchParams;
	const category = resolvedParams.category;

	const posts = await getBlogPosts();
	const categories = getBlogCategories(posts);
	const selectedCategory = typeof category === "string" ? category : undefined;

	// Filter categories if a category is selected
	const filteredCategories = selectedCategory
		? categories.filter((cat) => cat.name === selectedCategory)
		: categories;

	return (
		<div className="container py-8">
			<h1 className="text-3xl font-bold">{selectedCategory || "All Categories"}</h1>
			<div className="mb-8 flex flex-wrap gap-2">
				{categories.map((cat) => (
					<Link
						key={cat.name}
						href={`/blog/categories/${encodeURIComponent(cat.name)}`}
					>
						<Badge
							variant={cat.name === selectedCategory ? "default" : "secondary"}
							className="hover:bg-secondary/80"
						>
							{cat.name} ({cat.posts.length})
						</Badge>
					</Link>
				))}
			</div>

			<div className="grid gap-8">
				{filteredCategories.map((cat) => (
					<div key={cat.name} className="space-y-4">
						<h2 className="text-2xl font-semibold">{cat.name}</h2>
						<div className="grid gap-4">
							{cat.posts.map((post) => (
								<Link
									key={post.slug}
									href={`/blog/${post.slug}`}
									className={cn(
										"block rounded-lg border p-4 transition-colors hover:bg-muted"
									)}
								>
									<h3 className="mb-2 font-medium">{post.title}</h3>
									{post.description && (
										<p className="text-sm text-muted-foreground">
											{post.description}
										</p>
									)}
								</Link>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
