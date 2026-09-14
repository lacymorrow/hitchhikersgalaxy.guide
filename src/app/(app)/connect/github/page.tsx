import { Suspense } from "react";
import { GitHubConnectContent } from "./_components/github-connect-content";

/**
 * The content reads search params on the client, which needs a Suspense
 * boundary to prerender. The root loading.tsx used to supply one implicitly
 * (and caused soft 404s site-wide); this page owns its own.
 */
export default function GitHubConnectPage() {
  return (
    <Suspense fallback={null}>
      <GitHubConnectContent />
    </Suspense>
  );
}
