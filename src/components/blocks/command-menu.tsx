"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { ShortcutDisplay } from "@/components/primitives/shortcut-display";
import { useKeyboardShortcut } from "@/components/providers/keyboard-shortcut-provider";
import { Button } from "@/components/ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { ShortcutAction } from "@/config/keyboard-shortcuts";
import { cn } from "@/lib/utils";

export function CommandMenu() {
	const router = useRouter();
	const [open, setOpen] = React.useState(false);

	useKeyboardShortcut(
		ShortcutAction.OPEN_COMMAND_MENU,
		(event) => {
			event.preventDefault();
			setOpen((prevOpen) => !prevOpen);
		},
		undefined,
		[]
	);

	return (
		<>
			<Button
				variant="outline"
				className={cn(
					"relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
				)}
				onClick={() => setOpen(true)}
			>
				<span className="hidden lg:inline-flex">Search docs...</span>
				<span className="inline-flex lg:hidden">Search...</span>
				<ShortcutDisplay
					action={ShortcutAction.OPEN_COMMAND_MENU}
					className="pointer-events-none absolute right-1.5 top-2 hidden opacity-100 sm:flex"
				/>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput placeholder="Type a command or search..." />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Links">
						<CommandItem
							onSelect={() => {
								router.push("/docs");
								setOpen(false);
							}}
						>
							Documentation
						</CommandItem>
						<CommandItem
							onSelect={() => {
								router.push("/docs/components/accordion");
								setOpen(false);
							}}
						>
							Components
						</CommandItem>
						<CommandItem
							onSelect={() => {
								router.push("/docs/themes");
								setOpen(false);
							}}
						>
							Themes
						</CommandItem>
						<CommandItem
							onSelect={() => {
								router.push("/docs/examples");
								setOpen(false);
							}}
						>
							Examples
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</>
	);
}
