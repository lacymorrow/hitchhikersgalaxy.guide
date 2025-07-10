"use client";

import type { DialogProps } from "@radix-ui/react-dialog";
import { FileIcon, LaptopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as React from "react";
import { ShortcutDisplay } from "@/components/primitives/shortcut-display";
import { useKeyboardShortcut } from "@/components/providers/keyboard-shortcut-provider";
import { docsConfig } from "@/components/search/example";
import { Button } from "@/components/ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { ShortcutAction } from "@/config/keyboard-shortcuts";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";

export interface SearchMenuProps extends DialogProps {
	/**
	 * The title to display in the search menu dialog
	 * @default "Search Documentation"
	 */
	title?: string;

	/**
	 * Button variant for the trigger
	 * @default "outline"
	 */
	buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

	/**
	 * Custom button text
	 * @default "Search..."
	 */
	buttonText?: string | React.ReactNode;

	/**
	 * Whether to show the keyboard shortcut
	 * @default true
	 */
	showShortcut?: boolean;

	/**
	 * Custom button className
	 */
	buttonClassName?: string;

	/**
	 * Whether this is a minimal search (fewer options)
	 * @default false
	 */
	minimal?: boolean;
}

/**
 * Search menu component for searching documentation and accessing common actions
 * Can be configured for different use cases with props
 */
export function SearchMenu({
	title = `Search ${siteConfig.title}`,
	buttonVariant = "outline",
	buttonText = "Search...",
	showShortcut = true,
	buttonClassName,
	minimal = false,
	...props
}: SearchMenuProps) {
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const { setTheme } = useTheme();
	const [isClient, setIsClient] = React.useState(false);

	useKeyboardShortcut(
		ShortcutAction.OPEN_SEARCH_MENU,
		(event) => {
			const target = event.target as HTMLElement;
			if (
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement ||
				target.isContentEditable
			) {
				return;
			}
			event.preventDefault();
			setOpen((prevOpen) => !prevOpen);
		},
		undefined,
		[]
	);

	const runCommand = React.useCallback((command: () => unknown) => {
		setOpen(false);
		command();
	}, []);

	React.useEffect(() => {
		setIsClient(true);
	}, []);

	return (
		<>
			<Button
				variant={buttonVariant}
				className={cn(
					"relative w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-36",
					buttonClassName
				)}
				size="sm"
				onClick={() => setOpen(true)}
				{...props}
			>
				<span className="inline-flex text-xs">{buttonText}</span>
				{showShortcut && (
					<ShortcutDisplay
						action={ShortcutAction.OPEN_SEARCH_MENU}
						className={cn(
							"pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden lg:flex text-xs",
							"transition-opacity duration-300",
							isClient ? "opacity-100" : "opacity-0"
						)}
					/>
				)}
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<DialogTitle className="sr-only">{title}</DialogTitle>
				<CommandInput placeholder="Type a command or search..." />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Links">
						{docsConfig.mainNav
							.filter((navitem) => !navitem.external)
							.map((navItem) => (
								<>
									<CommandItem
										key={navItem.href}
										value={navItem.title}
										onSelect={() => {
											runCommand(() => router.push(navItem.href as string));
										}}
									>
										<FileIcon className="mr-2 h-4 w-4" />
										{navItem.title}
									</CommandItem>
								</>
							))}
					</CommandGroup>
					{!minimal && (
						<>
							<CommandSeparator />
							<CommandGroup heading="Theme">
								<CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
									<SunIcon className="mr-2 h-4 w-4" />
									Light
								</CommandItem>
								<CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
									<MoonIcon className="mr-2 h-4 w-4" />
									Dark
								</CommandItem>
								<CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
									<LaptopIcon className="mr-2 h-4 w-4" />
									System
								</CommandItem>
							</CommandGroup>
						</>
					)}
				</CommandList>
			</CommandDialog>
		</>
	);
}
