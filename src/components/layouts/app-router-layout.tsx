import { ViewTransitions } from "next-view-transitions";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { PageTracker } from "react-page-tracker";
import { KitProvider } from "@/components/providers/kit-provider";
import { TeamProvider } from "@/components/providers/team-provider";
import { ThemeProvider } from "@/components/ui/shipkit/theme";

/**
 * Root layout component that wraps the entire application.
 *
 * This component is intentionally synchronous and free of `auth()` / cookie
 * reads so that Next.js can statically render the root shell. Pages or nested
 * layouts that need the server session should call `auth()` themselves.
 *
 * `KitProvider` passes `session={null}` to `SessionProvider`, which will
 * client-fetch `/api/auth/session` on mount. Team data is loaded in the
 * dashboard layout where it's actually consumed.
 */
export function AppRouterLayout({
	children,
	themeProvider: ThemeProviderWrapper = ThemeProvider,
}: {
	children: ReactNode;
	themeProvider?: typeof ThemeProvider;
}) {
	return (
		<ViewTransitions>
			{/* PageTracker - Track page views */}
			<PageTracker />

			{/* ThemeProvider should wrap providers that might need theme context */}
			<ThemeProviderWrapper>
				{/* KitProvider - Manage all core providers (session fetched client-side) */}
				<KitProvider session={null}>
					<NuqsAdapter>
						<TeamProvider initialTeams={[{ id: "personal", name: "Personal" }]}>
							{children}
						</TeamProvider>
					</NuqsAdapter>
				</KitProvider>
			</ThemeProviderWrapper>
		</ViewTransitions>
	);
}
