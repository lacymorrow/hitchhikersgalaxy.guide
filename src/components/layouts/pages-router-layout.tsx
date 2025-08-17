import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { env } from "@/env";

/**
 * Simple layout wrapper for Pages Router pages
 */
export const PagesRouterLayout = ({
	children,
}: {
	children: ReactNode;
	hideHeader?: boolean;
	hideFooter?: boolean;
}) => {
	// Determine allowed themes based on build-time feature flags
	const lightEnabled = !!env.NEXT_PUBLIC_FEATURE_LIGHT_MODE_ENABLED;
	const darkEnabled = !!env.NEXT_PUBLIC_FEATURE_DARK_MODE_ENABLED;
	const bothEnabled = lightEnabled && darkEnabled;
	const computedThemes = [lightEnabled && "light", darkEnabled && "dark"].filter(Boolean) as string[];
	const themes = computedThemes.length ? computedThemes : ["light"]; // Fallback safety
	const defaultTheme = bothEnabled ? "system" : lightEnabled ? "light" : "dark";
	const forcedTheme = bothEnabled ? undefined : (lightEnabled ? "light" : "dark");
	return (
		<>
			<ThemeProvider
				attribute="class"
				defaultTheme={defaultTheme}
				enableSystem={bothEnabled}
				forcedTheme={forcedTheme}
				themes={themes}
			>
				<div className="flex min-h-screen flex-col py-10">
					<main className="flex-1">{children}</main>
				</div>
			</ThemeProvider>
		</>
	);
};
