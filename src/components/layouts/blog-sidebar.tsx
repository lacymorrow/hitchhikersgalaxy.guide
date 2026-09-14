"use client";

import { ClockIcon, MenuIcon, SearchIcon, TagIcon, TrendingUpIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Link } from "@/components/primitives/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { siteConfig } from "@/config/site-config";
import type { BlogPost } from "@/lib/blog";
import { cn } from "@/lib/utils";

interface BlogSidebarProps {
  posts: BlogPost[];
}

const BlogNavigation = ({ posts }: BlogSidebarProps) => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;

    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.title?.toLowerCase().includes(query) ||
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- intentional boolean OR over optional chain results
        post.description?.toLowerCase().includes(query) ||
        post.categories?.some((cat) => cat.toLowerCase().includes(query))
    );
  }, [posts, searchQuery]);

  // Get recent posts (latest 5)
  const recentPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        if (!a.publishedAt || !b.publishedAt) return 0;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      })
      .slice(0, 5);
  }, [posts]);

  // Get all unique categories
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    posts.forEach((post) => {
      post.categories?.forEach((cat) => {
        cats.add(cat);
      });
    });
    return Array.from(cats).sort();
  }, [posts]);

  const content = (
    <div className="flex h-full w-full max-w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-2 py-4">
        <div>
          <h2 className="font-semibold text-foreground">{siteConfig.name} Posts</h2>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 px-2">
        <SearchIcon className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 border-border bg-background pl-10"
        />
      </div>

      {/* Navigation Content */}
      <ScrollArea className="w-full flex-1 px-2 [&>[data-radix-scroll-area-viewport]>div]:!block">
        <div className="w-full max-w-full space-y-6">
          {/* Search Results */}
          {searchQuery && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Search Results</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredPosts.length} found
                </Badge>
              </div>
              <div className="space-y-1">
                {filteredPosts.map((post) => {
                  const isActive = pathname === `/blog/${post.slug}`;
                  return (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className={cn(
                        "group flex min-w-0 items-center gap-2 rounded-md p-2 transition-colors",
                        "hover:bg-accent/50",
                        isActive
                          ? "bg-primary font-medium text-primary-foreground"
                          : "text-foreground hover:text-primary"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {post.title}
                      </span>
                      {post.badge && (
                        <Badge
                          variant={isActive ? "secondary" : "outline"}
                          className="ml-2 shrink-0 text-xs"
                        >
                          {post.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
              {filteredPosts.length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">No articles found</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Recent Posts */}
          {!searchQuery && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Latest</h3>
              </div>
              <div className="space-y-1">
                {recentPosts.map((post) => {
                  const isActive = pathname === `/blog/${post.slug}`;
                  return (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className={cn(
                        "group flex min-w-0 items-center gap-2 rounded-md p-2 transition-colors",
                        "hover:bg-accent/50",
                        isActive
                          ? "bg-primary font-medium text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="min-w-0 truncate text-sm font-medium">{post.title}</div>
                        {post.publishedAt && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs opacity-70">
                            <ClockIcon className="h-3 w-3" />
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {post.badge && (
                        <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                          {post.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categories */}
          {!searchQuery && allCategories.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Categories</h3>
                </div>
                <div className="space-y-1">
                  {allCategories.map((category) => {
                    const categoryPosts = posts.filter((post) =>
                      post.categories?.includes(category)
                    );
                    return (
                      <Link
                        key={category}
                        href={`/blog/categories/${encodeURIComponent(category)}`}
                        className="group flex min-w-0 items-center gap-2 rounded-md p-2 transition-colors hover:bg-accent/50"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground group-hover:text-primary">
                          {category}
                        </span>
                        <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                          {categoryPosts.length}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 min-w-0 shrink-0 lg:block xl:w-80">
        <div className="sticky top-[var(--navbar-height)] h-[calc(100vh-var(--navbar-height))] w-full overflow-hidden">
          {content}
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="sticky top-0 z-40 lg:hidden">
        <div className="flex items-center gap-2 border-b bg-background p-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <MenuIcon className="h-4 w-4" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <VisuallyHidden asChild>
                <SheetTitle>Blog Navigation</SheetTitle>
              </VisuallyHidden>
              {content}
            </SheetContent>
          </Sheet>
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
      </div>
    </>
  );
};

export const BlogSidebar = BlogNavigation;
