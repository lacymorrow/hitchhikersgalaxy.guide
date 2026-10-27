"use client";

import { ErrorBoundary, type ErrorPageProps } from "@/components/primitives/error-boundary";
import { Link } from "@/components/primitives/link-with-transition";
import { Button, buttonVariants } from "@/components/ui/button";
import { GUIDE_UNAVAILABLE_DIGEST } from "@/lib/guide-read";
import { GuideUnavailable } from "./_components/guide-states";

/**
 * Error page for the guide routes.
 *
 * A guide route throws `GuideUnavailableError` when the records are
 * unreachable, which is how it answers with a retryable 5xx instead of the
 * soft 404 it used to serve (LAC-5888). That lands here, and the generic
 * boundary is the wrong thing to show for it: it opens "Something went wrong"
 * and then says "The rest of the site is working", which during a database
 * outage is false and reads as a bug in the page the visitor asked for.
 *
 * So an outage gets the state LAC-5520 already designed for it, in the
 * Guide's own voice and frame. Everything else still gets the generic
 * boundary, because everything else really is a fault.
 *
 * The match is on the digest, not the class: Next.js replaces a server error's
 * message and name with a generic string before this client component sees it,
 * and forwards only the digest.
 */
export default function GuideError({ error, reset }: ErrorPageProps) {
  if (error.digest !== GUIDE_UNAVAILABLE_DIGEST) {
    return <ErrorBoundary error={error} reset={reset} />;
  }

  return (
    <div className="container relative flex min-h-[60vh] max-w-4xl items-center py-6 lg:py-10">
      <div className="w-full rounded-lg border-4 border-[#70c8cd] bg-black p-6 shadow-[0_0_50px_rgba(112,200,205,0.2)] sm:p-10">
        <GuideUnavailable headingAs="h1" className="text-[#70c8cd]" />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            onClick={reset}
            className="bg-[#70c8cd] font-mono text-black hover:bg-[#70c8cd]/90"
          >
            Try again
          </Button>
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              className:
                "border-[#70c8cd]/40 bg-transparent font-mono text-[#70c8cd] hover:bg-[#70c8cd]/10 hover:text-[#70c8cd]",
            })}
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
