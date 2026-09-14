import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthorByline, AuthorProfile } from "@/components/modules/blog/author-profile";
import { BlogAuthors } from "@/components/modules/blog/authors";
import { BlogAuthorSkeleton } from "@/components/modules/blog/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { blogAuthors, getActiveAuthors, getAuthorById } from "@/config/blog-authors";
import { constructMetadata } from "@/config/metadata";

export const metadata: Metadata = constructMetadata({
  title: "Blog Authors Demo | Shipkit",
  description: "Demo page showcasing the new blog author system components and features.",
});

export default function BlogAuthorsDemo() {
  const activeAuthors = getActiveAuthors();
  const lacyAuthor = getAuthorById("lacy-morrow");
  const shipkitTeam = getAuthorById("shipkit-team");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Blog Authors System Demo</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Showcasing the new centralized author configuration system with enhanced components,
          accessibility features, and improved user experience.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary">Centralized Configuration</Badge>
          <Badge variant="secondary">Type-Safe</Badge>
          <Badge variant="secondary">Accessible</Badge>
          <Badge variant="secondary">Responsive</Badge>
        </div>
      </div>

      {/* Author Profiles - Full Version */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">Full Author Profiles</h2>
          <p className="text-muted-foreground">
            Comprehensive author cards with bio, social links, and post counts
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Suspense fallback={<BlogAuthorSkeleton />}>
            <AuthorProfile author={lacyAuthor} postCount={5} />
          </Suspense>
          <Suspense fallback={<BlogAuthorSkeleton />}>
            <AuthorProfile author={shipkitTeam} postCount={3} />
          </Suspense>
        </div>
      </section>

      <Separator />

      {/* Author Profiles - Compact Version */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">Compact Author Profiles</h2>
          <p className="text-muted-foreground">
            Condensed version perfect for sidebars and smaller spaces
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeAuthors.map((author) => (
            <Suspense key={author.id} fallback={<BlogAuthorSkeleton />}>
              <AuthorProfile
                author={author}
                postCount={(author.id.charCodeAt(0) % 10) + 1}
                showCompact={true}
              />
            </Suspense>
          ))}
        </div>
      </section>

      <Separator />

      {/* Author Bylines */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">Author Bylines</h2>
          <p className="text-muted-foreground">Compact author attribution for blog post headers</p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sample Blog Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AuthorByline author={lacyAuthor} publishedAt="2024-12-28" />
              <p className="text-muted-foreground">
                This is how an author byline would appear in a blog post header, showing the
                author&apos;s avatar, name, and publication date.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team-Authored Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AuthorByline author={shipkitTeam} publishedAt={new Date("2024-12-27")} />
              <p className="text-muted-foreground">
                Team-authored posts work seamlessly with the same component.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Multi-Author Display */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">Multi-Author Display</h2>
          <p className="text-muted-foreground">Show multiple authors with overlapping avatars</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Collaborative Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BlogAuthors authors={[lacyAuthor, shipkitTeam]} />
            <p className="text-muted-foreground">
              Multiple authors are displayed with overlapping avatars that link to their individual
              profile pages.
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* System Features */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">System Features</h2>
          <p className="text-muted-foreground">
            Key improvements and capabilities of the new author system
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Centralized Config</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All author data is managed in a single configuration file with TypeScript types for
                better maintainability.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">♿ Accessibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Full ARIA support, keyboard navigation, and screen reader compatibility throughout
                all components.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔗 Social Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatic social media link generation with proper icons and external link
                indicators.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📱 Responsive Design</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All components adapt seamlessly to different screen sizes and device types.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🛡️ Error Handling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Graceful fallbacks for missing images, broken links, and unavailable data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔄 Backward Compatible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Supports legacy author data while providing migration path to new system.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Technical Details */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">Technical Implementation</h2>
          <p className="text-muted-foreground">Under the hood details for developers</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Author Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="mb-2 font-medium">Location:</p>
                <code className="rounded bg-muted px-2 py-1 text-xs">
                  src/config/blog-authors.ts
                </code>
              </div>
              <div className="text-sm">
                <p className="mb-2 font-medium">Total Authors:</p>
                <Badge variant="outline">{Object.keys(blogAuthors).length}</Badge>
              </div>
              <div className="text-sm">
                <p className="mb-2 font-medium">Active Authors:</p>
                <Badge variant="outline">{activeAuthors.length}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Utility Functions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <p>
                  <code className="rounded bg-muted px-1 text-xs">getAuthorById()</code> - Get
                  author by ID
                </p>
                <p>
                  <code className="rounded bg-muted px-1 text-xs">getAuthorByName()</code> - Get
                  author by name
                </p>
                <p>
                  <code className="rounded bg-muted px-1 text-xs">convertLegacyAuthor()</code> -
                  Convert legacy data
                </p>
                <p>
                  <code className="rounded bg-muted px-1 text-xs">
                    authorUtils.getSocialLinks()
                  </code>{" "}
                  - Generate social links
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Usage Examples */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">Usage in MDX</h2>
          <p className="text-muted-foreground">
            How to use the new system in blog post frontmatter
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Single Author</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
                {`---
title: "My Blog Post"
publishedAt: 2024-12-28
authorId: "lacy-morrow"
categories: ["Development"]
---`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Multiple Authors</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
                {`---
title: "Team Post"
publishedAt: 2024-12-28
authorIds: ["lacy-morrow", "shipkit-team"]
categories: ["Development"]
---`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <div className="py-8 text-center text-sm text-muted-foreground">
        <p>
          This demo showcases the enhanced blog author system with improved performance,
          accessibility, and developer experience.
        </p>
      </div>
    </div>
  );
}
