"use client";

import { Icons } from "@/components/images/icons";
import { Button } from "@/components/ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

interface GlobalSearchProps {
	className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
	const [isOpen, setIsOpen] = React.useState(false);
	const [query, setQuery] = React.useState("");
	const [data, setData] = React.useState<
		{ title: string; items: any[] }[] | null
	>(null);
	const [isPending, startTransition] = React.useTransition();
	const router = useRouter();

	React.useEffect(() => {
		if (!query) {
			setData(null);
			return;
		}

		startTransition(async () => {
			try {
				const response = await fetch(`/api/search?query=${query}`);
				if (!response.ok) {
					throw new Error("Failed to fetch search results");
				}

				const results = await response.json();
				setData(results);
			} catch (error) {
				console.error("Search error:", error);
				toast.error("Failed to fetch search results");
			}
		});
	}, [query]);

	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setIsOpen((isOpen) => !isOpen);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const handleSelect = React.useCallback((callback: () => unknown) => {
		setIsOpen(false);
		callback();
	}, []);

	React.useEffect(() => {
		if (!isOpen) {
			setQuery("");
		}
	}, [isOpen]);

	return (
		<>
			<Button
				variant="outline"
				className={cn(
					"relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2",
					className,
				)}
				onClick={() => setIsOpen(true)}
			>
				<MagnifyingGlassIcon className="h-4 w-4 xl:mr-2" aria-hidden="true" />
				<span className="hidden xl:inline-flex">Search...</span>
				<span className="sr-only">Search</span>
				<kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</Button>
			<CommandDialog position="top" open={isOpen} onOpenChange={setIsOpen}>
				<DialogHeader>
					<VisuallyHidden asChild>
						<DialogTitle>Global Search</DialogTitle>
					</VisuallyHidden>
				</DialogHeader>
				<CommandInput
					placeholder="Type to search..."
					value={query}
					onValueChange={setQuery}
				/>
				<CommandList>
					<CommandEmpty
						className={cn(isPending ? "hidden" : "py-6 text-center text-sm")}
					>
						No results found.
					</CommandEmpty>
					{isPending ? (
						<div className="space-y-1 overflow-hidden px-1 py-2">
							<div className="animate-pulse">
								<div className="h-4 w-10 rounded bg-muted" />
								<div className="mt-2 space-y-2">
									{Array.from({ length: 3 }).map((_, i) => (
										<div key={i} className="h-8 rounded-sm bg-muted" />
									))}
								</div>
							</div>
						</div>
					) : (
						data?.map((group) => (
							<CommandGroup
								key={group.title}
								className="capitalize"
								heading={group.title}
							>
								{group.items.map((item) => (
									<CommandItem
										key={item.id}
										onSelect={() => handleSelect(() => router.push(item.url))}
									>
										{item.icon === "github" ? (
											<Icons.github className="mr-2 h-4 w-4" />
										) : item.icon === "download" ? (
											<Icons.download className="mr-2 h-4 w-4" />
										) : item.icon === "file" ? (
											<Icons.file className="mr-2 h-4 w-4" />
										) : item.icon === "user" ? (
											<Icons.user className="mr-2 h-4 w-4" />
										) : item.icon === "refresh" ? (
											<Icons.refresh className="mr-2 h-4 w-4" />
										) : item.icon === "help" ? (
											<Icons.help className="mr-2 h-4 w-4" />
										) : (
											<MagnifyingGlassIcon className="mr-2 h-4 w-4" />
										)}
										<div className="flex flex-col">
											<span>{item.title}</span>
											{item.description && (
												<span className="text-xs text-muted-foreground">
													{item.description}
												</span>
											)}
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						))
					)}
				</CommandList>
			</CommandDialog>
		</>
	);
}
