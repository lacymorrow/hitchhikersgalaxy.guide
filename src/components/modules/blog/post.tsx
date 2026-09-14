import type React from "react";
import { BlogImage } from "@/components/modules/blog/image";
import { Link } from "@/components/primitives/link";
import { authorUtils, type BlogAuthor, getAuthorByName } from "@/config/blog-authors";
import type { BlogPost } from "@/lib/blog";
import { formatDateForBlog } from "@/lib/utils/format-date";
import { BlogAuthors } from "./authors";
import { BlogBadge } from "./badge";

interface BlogPostProps {
  post: BlogPost & {
    badge?: string;
    authors?: { name: string; avatar: string }[]; // Legacy support
    authorObjects?: BlogAuthor[]; // New structured authors
    publishedAt?: string | Date;
    image?: string;
  };
  children: React.ReactNode;
}

export const BlogPostComponent = ({ post, children }: BlogPostProps) => {
  const displayDate = formatDateForBlog(post.publishedAt);

  // Determine which authors to display (prefer new system)
  const authorsToDisplay = post.authorObjects ?? post.authors;
  const singleAuthor = post.authorObject ?? (post.author ? { name: post.author } : null);

  return (
    <article className="md:flex">
      <h2 className="content-date mt-px h-full">
        <span>{displayDate}</span>
      </h2>
      <div className="content-block">
        <div className="feed-border" />
        <div className="feed-dot" />
        {post.badge && (
          <BlogBadge label={post.badge} className="absolute -top-6 right-0 mb-4 md:static" />
        )}
        <Link href={`/blog/${post.slug}`} className="group">
          <h1 className="mb-4 cursor-pointer text-xl font-bold group-hover:underline sm:text-3xl">
            {post.title}
          </h1>
        </Link>
        {post.image && (
          <BlogImage
            src={post.image}
            alt={post.title}
            className="blog-image mb-6"
            priority={false}
          />
        )}
        <div className="document">{children}</div>

        {/* Multiple authors */}
        {authorsToDisplay && authorsToDisplay.length > 0 && (
          <BlogAuthors authors={authorsToDisplay} />
        )}

        {/* Single author link (new system) */}
        {singleAuthor && post.authorObject && (
          <div className="mt-4 text-sm text-muted-foreground">
            By{" "}
            <Link
              href={authorUtils.getAuthorUrl(post.authorObject)}
              className="font-medium text-foreground hover:underline"
            >
              {authorUtils.getDisplayName(post.authorObject)}
            </Link>
          </div>
        )}

        {/* Single author link (legacy support) */}
        {singleAuthor && !post.authorObject && post.author && (
          <div className="mt-4 text-sm text-muted-foreground">
            By{" "}
            <Link
              href={authorUtils.getAuthorUrl(getAuthorByName(post.author))}
              className="font-medium text-foreground hover:underline"
            >
              {authorUtils.getDisplayName(getAuthorByName(post.author))}
            </Link>
          </div>
        )}
      </div>
    </article>
  );
};
