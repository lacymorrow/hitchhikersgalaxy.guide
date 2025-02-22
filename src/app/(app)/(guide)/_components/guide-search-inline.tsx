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
import { Loader2, Search, XCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface GuideSearchInlineProps {
	results: GuideEntry[];
}

export function GuideSearchInline({ results: initialResults }: GuideSearchInlineProps) {
	const { toast } = useToast();
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const [searchLoading, setSearchLoading] = React.useState(false);
	const [suggestionsLoading, setSuggestionsLoading] = React.useState(false);
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
				setSuggestionsLoading(true);
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
				setSuggestionsLoading(false);
			}
		};

		void fetchSimilarSearches();
	}, [debouncedSearch]);

	const onSearch = async (searchTerm: string) => {
		setError(null);
		try {
			setSearchLoading(true);
			const entry = await searchGuide(searchTerm);
			if (!entry) {
				throw new Error("No results found");
			}
			router.push(`/${entry.searchTerm}`);
			setOpen(false);
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
			setSearchLoading(false);
		}
	};

	// Only show suggestions if we have results or an error
	// Don't show during initial loading with no results
	const shouldShowSuggestions = Boolean(
		(suggestionsLoading && results.length > 0) || // Only show loader if we already had results
		(!suggestionsLoading && results.length > 0) || // Show when we have results
		error // Show when we have an error
	);

	// Handle keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Always allow Enter to submit if there's a search term, regardless of loading state
		if (e.key === "Enter" && search && !searchLoading) {
			e.preventDefault();
			void onSearch(search);
			return;
		}

		// Don't handle navigation keys if no suggestions are shown
		if (!open || !shouldShowSuggestions) {
			return;
		}

		const totalItems = results.length + (search ? 1 : 0);

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
				if (selectedIndex >= 0 && !searchLoading) {
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
					<div className="relative w-full">
						<div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
							<Search className="h-4 w-4 text-green-500/60" />
						</div>
						<Input
							ref={inputRef}
							placeholder="Type anything in the universe..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setOpen(true);
							}}
							onKeyDown={handleKeyDown}
							className={cn(
								"w-full pl-9 border-green-500/60 bg-black/80 text-green-400 placeholder:text-green-400/60 focus-visible:ring-green-500/60 disabled:opacity-50",
								"shadow-[0_0_20px_rgba(34,197,94,0.15)] focus-visible:shadow-[0_0_30px_rgba(34,197,94,0.3)]",
								"transition-all duration-300",
								"hover:border-green-500/80 hover:shadow-[0_0_25px_rgba(34,197,94,0.2)]",
								search && "pr-12" // Add padding when search has content
							)}
							aria-expanded={open}
							aria-controls="search-suggestions"
							aria-activedescendant={selectedIndex >= 0 ? `search-item-${selectedIndex}` : undefined}
							role="combobox"
							aria-autocomplete="list"
							disabled={searchLoading}
						/>
						{/* Show loading indicator inline when loading suggestions with no results */}
						{(suggestionsLoading && !shouldShowSuggestions) && (
							<div className="absolute right-3 top-1/2 -translate-y-1/2">
								<Loader2 className="h-4 w-4 animate-spin text-green-500" />
							</div>
						)}
						{/* Show submit button when there's text */}
						<AnimatePresence mode="wait">
							{search && (
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -10 }}
									transition={{ duration: 0.15, ease: "easeOut" }}
									className="absolute right-1.5 top-1/2 -translate-y-1/2"
								>
									<motion.div
										initial={{ scale: 0.8 }}
										animate={{ scale: 1 }}
										exit={{ scale: 0.8 }}
										transition={{ duration: 0.15, ease: "easeOut" }}
									>
										<Button
											size="icon"
											variant="outline"
											className="h-7 w-7 shrink-0 border-green-500/60 text-green-500 hover:bg-green-500/10 disabled:opacity-50"
											onClick={() => void onSearch(search)}
											disabled={searchLoading || !search.trim()}
										>
											<AnimatePresence mode="wait">
												{searchLoading ? (
													<motion.div
														key="loading"
														initial={{ opacity: 0, rotate: -180 }}
														animate={{ opacity: 1, rotate: 0 }}
														exit={{ opacity: 0, rotate: 180 }}
														transition={{ duration: 0.2 }}
													>
														<Loader2 className="h-3 w-3 animate-spin" />
													</motion.div>
												) : (
													<motion.div
														key="arrow"
														initial={{ opacity: 0, x: -5 }}
														animate={{ opacity: 1, x: 0 }}
														exit={{ opacity: 0, x: 5 }}
														transition={{ duration: 0.2 }}
													>
														<ArrowRight className="h-3 w-3" />
													</motion.div>
												)}
											</AnimatePresence>
											<span className="sr-only">Search</span>
										</Button>
									</motion.div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
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
						) : suggestionsLoading ? (
							<div className="flex items-center justify-center gap-2 py-6">
								<Loader2 className="h-6 w-6 animate-spin text-green-500" />
								<p className="text-sm text-green-400/60">
									Consulting the Guide...
								</p>
							</div>
						) : null}
					</CommandEmpty>
					{!suggestionsLoading && !error && (
						<CommandGroup heading="Suggestions" className="text-green-400/60">
							{results.map((result, index) => (
								<CommandItem
									key={result.id}
									value={result.searchTerm}
									onSelect={() => !searchLoading && void onSearch(result.searchTerm)}
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
									onSelect={() => !searchLoading && void onSearch(search)}
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
