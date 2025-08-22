import { ThemeProvider } from "next-themes";
import { ViewTransitions } from "next-view-transitions";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { PageTracker } from "react-page-tracker";
import { ShipkitProvider } from "@/components/providers/shipkit-provider";
import { TeamProvider } from "@/components/providers/team-provider";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { teamService } from "@/server/services/team-service";

/**
 * Root layout component that wraps the entire application
 * Uses ShipkitProvider to manage all core providers
 */
export async function AppRouterLayout({
	children,
	themeProvider: ThemeProviderWrapper = ThemeProvider,
}: {
	children: ReactNode;
	themeProvider?: any;
}) {
	// Fetch user teams if authenticated
	const session = await auth();
	let userTeams = [{ id: "personal", name: "Personal" }];
	
	if (session?.user?.id) {
		try {
			const teams = await teamService.getUserTeams(session.user.id);
			if (teams && teams.length > 0) {
				userTeams = teams.map(tm => ({
					id: tm.team.id,
					name: tm.team.name
				}));
			} else {
				// Ensure at least one personal team exists
				const personalTeam = await teamService.ensureOnePersonalTeam(session.user.id);
				if (personalTeam) {
					userTeams = [{
						id: personalTeam.id,
						name: personalTeam.name
					}];
				}
			}
		} catch (error) {
			console.error("Failed to fetch user teams:", error);
		}
	}
	// Determine allowed themes based on build-time feature flags
	const lightEnabled = !!env.NEXT_PUBLIC_FEATURE_LIGHT_MODE_ENABLED;
	const darkEnabled = !!env.NEXT_PUBLIC_FEATURE_DARK_MODE_ENABLED;
	const bothEnabled = lightEnabled && darkEnabled;
	const computedThemes = [lightEnabled && "light", darkEnabled && "dark"].filter(Boolean) as string[];
	const themes = computedThemes.length ? computedThemes : ["light"]; // Fallback safety
	const defaultTheme = bothEnabled ? "system" : lightEnabled ? "light" : "dark";
	const forcedTheme = bothEnabled ? undefined : (lightEnabled ? "light" : "dark");

	return (
		<ViewTransitions>
			{/* PageTracker - Track page views */}
			<PageTracker />

			{/* ThemeProvider should wrap providers that might need theme context */}
			<ThemeProviderWrapper
				attribute="class"
				defaultTheme={defaultTheme}
				enableSystem={bothEnabled}
				forcedTheme={forcedTheme}
				themes={themes}
			>
				{/* ShipkitProvider - Manage all core providers */}
				<ShipkitProvider>
					<NuqsAdapter>
						<TeamProvider initialTeams={userTeams}>{children}</TeamProvider>
					</NuqsAdapter>
				</ShipkitProvider>
			</ThemeProviderWrapper>
		</ViewTransitions>
	);
}
