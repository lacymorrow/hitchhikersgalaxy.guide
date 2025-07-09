"use client";

import { DialogTitle } from "@radix-ui/react-dialog";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";

export function DocsSearch() {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	const runCommand = useCallback((command: () => unknown) => {
		setOpen(false);
		command();
	}, []);

	return (
		<>
			<div className="relative w-full">
				<MagnifyingGlassIcon className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
				<Input
					className="h-9 w-full rounded-[0.5rem] bg-background pl-8 text-sm text-muted-foreground"
					placeholder="Search docs..."
					onClick={() => setOpen(true)}
				/>
				<kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</div>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<DialogTitle className="sr-only">Search Documentation</DialogTitle>
				<CommandInput placeholder="Type a command or search..." />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Documentation">
						<CommandItem
							onSelect={() => {
								runCommand(() => router.push("/docs/introduction"));
							}}
						>
							Introduction
						</CommandItem>
						<CommandItem
							onSelect={() => {
								runCommand(() => router.push("/docs/quickstart"));
							}}
						>
							Quickstart Guide
						</CommandItem>
						<CommandItem
							onSelect={() => {
								runCommand(() => router.push("/docs/core/architecture"));
							}}
						>
							Architecture
						</CommandItem>
					</CommandGroup>
					<CommandGroup heading="API Reference">
						<CommandItem
							onSelect={() => {
								runCommand(() => router.push("/docs/api-reference/authentication"));
							}}
						>
							Authentication API
						</CommandItem>
						<CommandItem
							onSelect={() => {
								runCommand(() => router.push("/docs/api-reference/integrations"));
							}}
						>
							Integrations API
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</>
	);
}
