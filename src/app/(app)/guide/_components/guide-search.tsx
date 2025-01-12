"use client";

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
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { searchGuide } from "@/server/actions/guide-search";
import type { GuideEntry } from "@/server/db/schema";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Loader2, Search, XCircle } from "lucide-react";
import * as React from "react";

interface GuideSearchProps {
	results: any[];
}

export const GuideSearch = ({ results }: GuideSearchProps) => {
	const { toast } = useToast();
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [search, setSearch] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);
	const debouncedSearch = useDebounce(search, 300);
	const [selectedEntry, setSelectedEntry] = React.useState<GuideEntry | null>(
		null,
	);

	const searchInputRef = React.useRef<HTMLInputElement>(null);


	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const onSearch = async (searchTerm: string) => {
		setError(null);
		try {
			setLoading(true);
			const entry = await searchGuide(searchTerm);
			if (entry) {
				setSelectedEntry(entry);
				setError(null);
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to search";
			setError(message);
			toast({
				title: "Error",
				description: message,
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setSelectedEntry(null);
		setError(null);
		setSearch("");
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	};

	return (
		<div className="relative">
			<Button
				variant="outline"
				className="relative h-12 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-96 lg:w-full"
				onClick={() => setOpen(true)}
			>
				<span className="hidden lg:inline-flex">Search the Guide...</span>
				<span className="inline-flex lg:hidden">Search...</span>
				<kbd className="pointer-events-none absolute right-1.5 top-2.5 hidden h-7 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</Button>

			<CommandDialog open={open} onOpenChange={setOpen}>
				<DialogHeader>
					<VisuallyHidden asChild>
						<DialogTitle>Search Guide</DialogTitle>
					</VisuallyHidden>
				</DialogHeader>
				<CommandInput
					ref={searchInputRef}
					placeholder="Type anything in the universe..."
					value={search}
					onValueChange={setSearch}
				/>
				<CommandList>
					<CommandEmpty>
						{error ? (
							<div className="flex flex-col items-center gap-2 p-4">
								<XCircle className="h-6 w-6 text-destructive" />
								<p className="text-sm text-destructive">{error}</p>
							</div>
						) : (
							"No results found."
						)}
					</CommandEmpty>
					{loading ? (
						<div className="flex items-center justify-center gap-2 py-6">
							<Loader2 className="h-6 w-6 animate-spin" />
							<p className="text-sm text-muted-foreground">
								Consulting the Guide...
							</p>
						</div>
					) : selectedEntry ? (
						<div className="p-4">
							<h3 className="mb-2 text-lg font-semibold capitalize">
								{selectedEntry.searchTerm}
							</h3>
							<p className="whitespace-pre-wrap text-sm text-muted-foreground">
								{selectedEntry.content}
							</p>
							<Button className="mt-4" variant="outline" onClick={handleReset}>
								Search Again
							</Button>
						</div>
					) : (
						<CommandGroup heading="Suggestions">
							{results.map((result) => (
								<CommandItem
									key={result.id}
									value={result.searchTerm}
									onSelect={() => void onSearch(result.searchTerm)}
								>
									<Search className="mr-2 h-4 w-4" />
									<span className="capitalize">{result.searchTerm}</span>
								</CommandItem>
							))}
							{search && (
								<CommandItem
									value={search}
									onSelect={() => void onSearch(search)}
								>
									<Search className="mr-2 h-4 w-4" />
									Search for "{search}"
								</CommandItem>
							)}
						</CommandGroup>
					)}
				</CommandList>
			</CommandDialog>
		</div>
	);
};
