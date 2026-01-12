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
import { useRouter } from "next/navigation";
import * as React from "react";

interface GuideSearchProps {
	results: GuideEntry[];
}

export const GuideSearch = ({ results: initialResults }: GuideSearchProps) => {
	const { toast } = useToast();
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [search, setSearch] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);
	const [results, setResults] = React.useState<GuideEntry[]>(initialResults);
	const debouncedSearch = useDebounce(search, 300);
	const [selectedEntry, setSelectedEntry] = React.useState<GuideEntry | null>(null);
	const searchInputRef = React.useRef<HTMLInputElement>(null);
	const [activeItem, setActiveItem] = React.useState<string | null>(null);

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

	// Fetch similar searches when the debounced search term changes
	React.useEffect(() => {
		const fetchSimilarSearches = async () => {
			if (!debouncedSearch) {
				setResults([]);
				return;
			}

			try {
				setLoading(true);
				const response = await fetch(`/api/guide/search/similar?term=${encodeURIComponent(debouncedSearch)}`);
				if (!response.ok) {
					throw new Error("Failed to fetch similar searches");
				}
				const data = await response.json();
				setResults(data);
				setError(null);
			} catch (error) {
				console.error("Error fetching similar searches:", error);
				setResults([]);
			} finally {
				setLoading(false);
			}
		};

		void fetchSimilarSearches();
	}, [debouncedSearch]);

	const onSearch = async (searchTerm: string) => {
		setError(null);
		try {
			setLoading(true);
			const result = await searchGuide(searchTerm);
			if (result.success && result.data) {
				setSelectedEntry(result.data);
				setError(null);
				router.push(`/${encodeURIComponent(result.data.searchTerm)}`);
				setOpen(false);
			} else {
				const message = result.error || "Failed to find or create guide entry.";
				setError(message);
				toast({
					title: "Error",
					description: message,
					variant: "destructive",
				});
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

	const handleItemSelect = (value: string) => {
		setActiveItem(value);
		void onSearch(value);
	};

	return (
		<div className="relative">
			<Button
				variant="outline"
				className="relative w-full justify-start text-sm text-[#70c8cd] border-[#70c8cd]/50 hover:bg-[#70c8cd]/10 hover:text-[#70c8cd] hover:border-[#70c8cd] sm:pr-12 md:w-52"
				onClick={() => setOpen(true)}
				size="sm"
			>
				<span className="hidden lg:inline-flex">Search the Guide...</span>
				<span className="inline-flex lg:hidden">Search...</span>
				<kbd className="pointer-events-none absolute right-1 hidden select-none items-center gap-1 rounded border border-[#70c8cd]/30 bg-[#70c8cd]/5 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
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
					className="border-b border-[#70c8cd]/30 text-[#70c8cd]"
				/>
				<CommandList className="bg-black text-[#70c8cd]">
					<CommandEmpty>
						{error ? (
							<div className="flex flex-col items-center gap-2 p-4">
								<XCircle className="h-6 w-6 text-destructive" />
								<p className="text-sm text-destructive">{error}</p>
							</div>
						) : loading ? (
							<div className="flex items-center justify-center gap-2 py-6">
								<Loader2 className="h-6 w-6 animate-spin text-[#70c8cd]" />
								<p className="text-sm text-[#70c8cd]/70">
									Consulting the Guide...
								</p>
							</div>
						) : (
							"No results found."
						)}
					</CommandEmpty>
					{!loading && !error && !selectedEntry && (
						<>
							<CommandGroup heading="Suggestions" className="text-[#70c8cd]/70">
								{results.map((result) => (
									<CommandItem
										key={result.id}
										value={result.searchTerm}
										onSelect={() => handleItemSelect(result.searchTerm)}
										className={activeItem === result.searchTerm ? "bg-[#70c8cd]/10 text-[#70c8cd]" : "text-[#70c8cd]"}
									>
										<Search className="mr-2 h-4 w-4" />
										<span className="capitalize">{result.searchTerm}</span>
									</CommandItem>
								))}
							</CommandGroup>
							{search && (
								<CommandGroup heading="Search" className="text-[#70c8cd]/70">
									<CommandItem
										value={`search-${search}`}
										onSelect={() => handleItemSelect(search)}
										className={activeItem === search ? "bg-[#70c8cd]/10 text-[#70c8cd]" : "text-[#70c8cd]"}
									>
										<Search className="mr-2 h-4 w-4" />
										Search for "{search}"
									</CommandItem>
								</CommandGroup>
							)}
						</>
					)}
					{selectedEntry && (
						<div className="p-4">
							<h3 className="mb-2 text-lg font-semibold capitalize text-[#70c8cd]">
								{selectedEntry.searchTerm}
							</h3>
							<p className="whitespace-pre-wrap text-sm text-[#70c8cd]/70">
								{selectedEntry.content}
							</p>
							<Button
								className="mt-4 border-[#70c8cd] text-[#70c8cd] hover:bg-[#70c8cd]/10 hover:text-[#70c8cd]"
								variant="outline"
								onClick={handleReset}
							>
								Search Again
							</Button>
						</div>
					)}
				</CommandList>
			</CommandDialog>
		</div>
	);
};
