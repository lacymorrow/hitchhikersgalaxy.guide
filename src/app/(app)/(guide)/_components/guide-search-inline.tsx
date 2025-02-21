"use client";

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { searchGuide } from "@/server/actions/guide-search";
import type { GuideEntry } from "@/server/db/schema";
import { Loader2, Search, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GuideSearchInlineProps {
	results: GuideEntry[];
}

export function GuideSearchInline({ results: initialResults }: GuideSearchInlineProps) {
	const { toast } = useToast();
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [search, setSearch] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);
	const [results, setResults] = React.useState<GuideEntry[]>(initialResults);
	const debouncedSearch = useDebounce(search, 300);
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [selectedIndex, setSelectedIndex] = React.useState(-1);

	// Reset selected index when results change
	React.useEffect(() => {
		setSelectedIndex(-1);
	}, [results]);

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
			const entry = await searchGuide(searchTerm);
			if (entry) {
				setError(null);
				setOpen(false);
				// Navigate to the entry page
				router.push(`/${entry.searchTerm}`);
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

	// Only show suggestions if we have results or an error
	// Don't show during initial loading with no results
	const shouldShowSuggestions = Boolean(
		(loading && results.length > 0) || // Only show loader if we already had results
		(!loading && results.length > 0) || // Show when we have results
		error // Show when we have an error
	);

	// Handle keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Don't handle navigation keys if no suggestions are shown
		if (!open || !shouldShowSuggestions) {
			if (e.key === "Enter" && search) {
				void onSearch(search);
			}
			return;
		}

		const totalItems = results.length + (search ? 1 : 0); // Add 1 for "Search for" option

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) => (prev + 1) % totalItems);
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
				break;
			case "Enter":
				e.preventDefault();
				if (selectedIndex === -1 && search) {
					void onSearch(search);
				} else if (selectedIndex >= 0) {
					if (selectedIndex < results.length) {
						void onSearch(results[selectedIndex].searchTerm);
					} else {
						void onSearch(search);
					}
				}
				break;
			case "Escape":
				setOpen(false);
				inputRef.current?.blur();
				break;
		}
	};

	return (
		<Popover
			open={open && shouldShowSuggestions}
			onOpenChange={(isOpen) => {
				setOpen(isOpen);
				if (!isOpen) {
					setSelectedIndex(-1);
				}
				// Ensure input keeps focus when popover opens
				if (isOpen) {
					inputRef.current?.focus();
				}
			}}
		>
			<PopoverTrigger asChild>
				<div className="relative w-full">
					<Input
						ref={inputRef}
						placeholder="Type anything in the universe..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setOpen(true);
						}}
						onKeyDown={handleKeyDown}
						className="w-full border-green-500/20 bg-transparent text-green-400 placeholder:text-green-400/60 focus-visible:ring-green-500/20"
						aria-expanded={open}
						aria-controls="search-suggestions"
						aria-activedescendant={selectedIndex >= 0 ? `search-item-${selectedIndex}` : undefined}
						role="combobox"
						aria-autocomplete="list"
					/>
					{/* Show loading indicator inline when loading with no results */}
					{loading && !shouldShowSuggestions && (
						<div className="absolute right-3 top-1/2 -translate-y-1/2">
							<Loader2 className="h-4 w-4 animate-spin text-green-500" />
						</div>
					)}
				</div>
			</PopoverTrigger>
			<PopoverContent
				className="w-[var(--radix-popover-trigger-width)] border-green-500/20 bg-black p-0"
				align="start"
				id="search-suggestions"
				role="listbox"
				onOpenAutoFocus={(e) => {
					// Prevent the popover from stealing focus
					e.preventDefault();
					// Keep input focused
					inputRef.current?.focus();
				}}
				onPointerDownOutside={(e) => {
					// Prevent closing when clicking inside the input
					if (e.target === inputRef.current) {
						e.preventDefault();
					}
				}}
			>
				<Command className="border-none bg-transparent">
					<CommandEmpty>
						{error ? (
							<div className="flex flex-col items-center gap-2 p-4">
								<XCircle className="h-6 w-6 text-destructive" />
								<p className="text-sm text-destructive">{error}</p>
							</div>
						) : loading ? (
							<div className="flex items-center justify-center gap-2 py-6">
								<Loader2 className="h-6 w-6 animate-spin text-green-500" />
								<p className="text-sm text-green-400/60">
									Consulting the Guide...
								</p>
							</div>
						) : null}
					</CommandEmpty>
					{!loading && !error && (
						<CommandGroup heading="Suggestions" className="text-green-400/60">
							{results.map((result, index) => (
								<CommandItem
									key={result.id}
									value={result.searchTerm}
									onSelect={() => void onSearch(result.searchTerm)}
									className={cn(
										"text-green-400 aria-selected:bg-green-500/10",
										selectedIndex === index && "bg-green-500/10"
									)}
									id={`search-item-${index}`}
									role="option"
									aria-selected={selectedIndex === index}
								>
									<Search className="mr-2 h-4 w-4" />
									<span className="capitalize">{result.searchTerm}</span>
								</CommandItem>
							))}
							{search && (
								<CommandItem
									value={search}
									onSelect={() => void onSearch(search)}
									className={cn(
										"text-green-400 aria-selected:bg-green-500/10",
										selectedIndex === results.length && "bg-green-500/10"
									)}
									id={`search-item-${results.length}`}
									role="option"
									aria-selected={selectedIndex === results.length}
								>
									<Search className="mr-2 h-4 w-4" />
									Search for "{search}"
								</CommandItem>
							)}
						</CommandGroup>
					)}
				</Command>
			</PopoverContent>
		</Popover>
	);
}
