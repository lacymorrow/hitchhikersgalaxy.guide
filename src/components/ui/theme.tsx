/**
 * @description A theme provider and theme toggle components for light/dark mode
 * @category Theme
 * @status stable
 * @version 1.0.0
 *
 * @example
 * <ThemeProvider>
 *   <ThemeToggle />
 *   // or
 *   <ThemeChooser />
 * </ThemeProvider>
 *
 * @props {object} ThemeProvider.props
 * - attribute="class" - HTML attribute to apply theme
 * - defaultTheme="system" - Default theme
 * - enableSystem=true - Enable system theme detection
 * - disableTransitionOnChange=false - Disable transitions when changing theme
 *
 * @props {object} ThemeToggle.props
 * - variant="ghost" - Button variant
 * - size="icon" - Button size
 *
 * @props {object} ThemeChooser.props
 * - variant="ghost" - Button variant
 * - size="icon" - Button size
 *
 * @see https://ui.shadcn.com/docs/dark-mode
 * @see https://github.com/pacocoursey/next-themes
 */

"use client";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { env } from "@/env";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ThemeButton = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
	<Button variant="ghost" size="icon" {...props} ref={ref}>
		<SunIcon className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
		<MoonIcon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
		<span className="sr-only">Toggle theme</span>
	</Button>
));
ThemeButton.displayName = "ThemeButton";

const ThemeToggle = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
	const { theme, setTheme } = useTheme();

	const lightEnabled = !!env.NEXT_PUBLIC_FEATURE_LIGHT_MODE_ENABLED;
	const darkEnabled = !!env.NEXT_PUBLIC_FEATURE_DARK_MODE_ENABLED;
	const canToggle = lightEnabled && darkEnabled;

	function handleClick() {
		if (!canToggle) return;
		setTheme(theme === "light" ? "dark" : "light");
	}

	return <ThemeButton onClick={handleClick} disabled={!canToggle} {...props} ref={ref} />;
});
ThemeToggle.displayName = "ThemeToggle";

const ThemeChooser = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
	const { setTheme } = useTheme();

	const lightEnabled = !!env.NEXT_PUBLIC_FEATURE_LIGHT_MODE_ENABLED;
	const darkEnabled = !!env.NEXT_PUBLIC_FEATURE_DARK_MODE_ENABLED;
	const bothEnabled = lightEnabled && darkEnabled;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<ThemeButton {...props} ref={ref} />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{lightEnabled && (
					<DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
				)}
				{darkEnabled && (
					<DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
				)}
				{bothEnabled && (
					<DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
});
ThemeChooser.displayName = "ThemeChooser";

// Wrapper ThemeProvider that enforces allowed themes based on build-time flags
// while preserving a compatible interface with next-themes' ThemeProvider
const ThemeProvider = ({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) => {
	const lightEnabled = !!env.NEXT_PUBLIC_FEATURE_LIGHT_MODE_ENABLED;
	const darkEnabled = !!env.NEXT_PUBLIC_FEATURE_DARK_MODE_ENABLED;
	const bothEnabled = lightEnabled && darkEnabled;
	const computedThemes = [lightEnabled && "light", darkEnabled && "dark"].filter(Boolean) as string[];
	const themes = computedThemes.length ? computedThemes : ["light"];
	const defaultTheme = bothEnabled ? "system" : lightEnabled ? "light" : "dark";
	const forcedTheme = bothEnabled ? undefined : (lightEnabled ? "light" : "dark");

	return (
		<NextThemesProvider
			attribute="class"
			enableSystem={bothEnabled}
			forcedTheme={forcedTheme}
			defaultTheme={defaultTheme}
			themes={themes}
			disableTransitionOnChange
			{...props}
		>
			{children}
		</NextThemesProvider>
	);
};

export { ThemeChooser, ThemeProvider, ThemeToggle };
