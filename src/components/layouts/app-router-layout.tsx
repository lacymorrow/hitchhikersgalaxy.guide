import { ViewTransitions } from "next-view-transitions";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { PageTracker } from "react-page-tracker";
import { KitProvider } from "@/components/providers/kit-provider";
import { TeamProvider } from "@/components/providers/team-provider";
import { Providers } from "@/config/providers";

/**
 * Root layout component that wraps the entire application.
 *
 * This component is intentionally synchronous and free of `auth()` / cookie
 * reads so that Next.js can statically render the root shell. Pages or nested
 * layouts that need the server session should call `auth()` themselves.
 *
 * `KitProvider` omits the `session` prop so `SessionProvider` receives
 * `undefined` and client-fetches `/api/auth/session` on mount. Team data is loaded in the
 * dashboard layout where it's actually consumed.
 *
 * Theme is provided by KitProvider's internal ThemeProvider (shared with Pages Router).
 *
 * `Providers` composes every `src/config/providers/*.provider.tsx` (generated
 * by `scripts/generate-providers.ts` on predev/prebuild). Registry items add a
 * provider by adding a file there instead of editing this layout.
 */
export function AppRouterLayout({ children }: { children: ReactNode }) {
  return (
    <ViewTransitions>
      {/* PageTracker - Track page views */}
      <PageTracker />

      <Providers>
        {/* KitProvider - Manage all core providers including theme (session fetched client-side) */}
        <KitProvider>
          <NuqsAdapter>
            <TeamProvider initialTeams={[{ id: "personal", name: "Personal" }]}>
              {children}
            </TeamProvider>
          </NuqsAdapter>
        </KitProvider>
      </Providers>
    </ViewTransitions>
  );
}
