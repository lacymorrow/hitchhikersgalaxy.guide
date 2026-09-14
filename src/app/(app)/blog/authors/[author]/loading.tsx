import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthorPageLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Author Profile Section */}
      <div className="mb-12">
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          {/* Author Profile Card Skeleton */}
          <div className="w-full flex-shrink-0 lg:w-96">
            <Card className="w-full max-w-md">
              <CardHeader className="pb-4">
                <div className="flex flex-col items-start gap-4 sm:flex-row">
                  <div className="relative">
                    <Skeleton className="h-20 w-20 rounded-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-col gap-2">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="mb-3 h-4 w-32" />
                    <div className="flex flex-wrap gap-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* About section */}
                <div>
                  <Skeleton className="mb-3 h-5 w-16" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>

                {/* Social links */}
                <div>
                  <Skeleton className="mb-3 h-5 w-20" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="w-18 h-8" />
                  </div>
                </div>

                {/* View all posts button */}
                <div className="pt-4">
                  <Skeleton className="h-9 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Header section */}
          <div className="flex-1 lg:pt-8">
            <Skeleton className="mb-4 h-12 w-80" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="mb-8">
        <Skeleton className="mb-6 h-8 w-32" />
      </div>

      {/* Posts List */}
      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: decorative/static array, key is stable index
          <Card key={i} className="transition-colors">
            <CardHeader>
              <div className="mb-2 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="mb-2 h-7 w-full max-w-md" />
              <Skeleton className="h-5 w-full max-w-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
