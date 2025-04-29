"use client";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { searchGuide } from "@/server/actions/guide-search";
import type { GuideEntry } from "@/server/db/schema";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Search, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { SearchResultItem } from "./search-result-item";

interface GuideSearchInlineProps {
	results: GuideEntry[];
}

// Function to validate if a search term is reasonable
const isReasonableSearchTerm = (term: string): boolean => {
	// Trim and normalize the term
	const normalizedTerm = term.trim().toLowerCase();

	// Empty searches are not valid
	if (!normalizedTerm) return false;

	// Check for obvious gibberish patterns
	const hasExcessiveSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{3,}/.test(normalizedTerm);
	const hasExcessiveNumbers = /\d{4,}/.test(normalizedTerm); // 4+ consecutive numbers
	const hasRandomCharacters = /([a-z])\1{3,}/.test(normalizedTerm); // 4+ of the same character
	const isTooRandom = /[qwxzj]{3,}/.test(normalizedTerm); // 3+ uncommon letters together

	// If it looks like gibberish, reject it
	if (hasExcessiveSpecialChars || hasExcessiveNumbers || hasRandomCharacters || isTooRandom) {
		return false;
	}

	// Check if it's too short (but allow short words like "AI", "UI", etc.)
	if (normalizedTerm.length < 2) {
		return false;
	}

	// Allow reasonable-looking terms
	return true;
};

export function GuideSearchInline({ results: initialResults }: GuideSearchInlineProps) {
	const { toast } = useToast();
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const [searchLoading, setSearchLoading] = React.useState(false);
	const [suggestionsLoading, setSuggestionsLoading] = React.useState(false);
	const [validationLoading, setValidationLoading] = React.useState(false);
	const [search, setSearch] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);
	const [results, setResults] = React.useState<GuideEntry[]>(initialResults);
	const debouncedSearch = useDebounce(search, 300);
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [selectedIndex, setSelectedIndex] = React.useState(-1);
	const [aiSuggestions, setAiSuggestions] = React.useState<string[]>([]);

	// Reset selected index when results change
	React.useEffect(() => {
		setSelectedIndex(-1);
	}, [results]);

	// Fetch similar searches when the debounced search term changes
	React.useEffect(() => {
		const fetchSimilarSearches = async () => {
			if (!debouncedSearch) {
				setResults([]);
				setAiSuggestions([]);
				return;
			}

			try {
				setSuggestionsLoading(true);
				const response = await fetch(`/api/guide/search/similar?term=${encodeURIComponent(debouncedSearch)}`);
				if (!response.ok) {
					console.error(`API error: ${response.status} ${response.statusText}`);
					throw new Error(`Failed to fetch similar searches: ${response.status} ${response.statusText}`);
				}
				const data = await response.json();
				setResults(data);

				// If we have at least 3 characters, try to get AI suggestions
				if (debouncedSearch.length >= 3) {
					void fetchAiSuggestions(debouncedSearch);
				}

				setError(null);
			} catch (error) {
				console.error("Error fetching similar searches:", error);
				setResults([]);
				setError(error instanceof Error ? error.message : "Failed to fetch similar searches");
			} finally {
				setSuggestionsLoading(false);
			}
		};

		void fetchSimilarSearches();
	}, [debouncedSearch]);

	// Fetch AI-powered suggestions
	const fetchAiSuggestions = async (searchTerm: string) => {
		try {
			const response = await fetch(`/api/guide/search/suggestions?term=${encodeURIComponent(searchTerm)}`);
			if (!response.ok) {
				console.error(`API error: ${response.status} ${response.statusText}`);
				return;
			}
			const data = await response.json();
			setAiSuggestions(data.suggestions || []);
		} catch (error) {
			console.error("Error fetching AI suggestions:", error);
		}
	};

	// Validate search term using AI
	const validateSearchTerm = async (term: string): Promise<{ valid: boolean; message: string }> => {
		// Basic validation
		if (!term.trim()) {
			return { valid: false, message: "Search term cannot be empty" };
		}

		if (term.length < 2) {
			return { valid: false, message: "Search term must be at least 2 characters" };
		}

		// AI validation
		try {
			const response = await fetch(`/api/guide/search/validate?term=${encodeURIComponent(term)}`);

			if (!response.ok) {
				console.warn("Validation API error:", response.status);
				// If the validation API fails, we'll still allow the search to proceed
				return { valid: true, message: "" };
			}

			const data = await response.json();
			return {
				valid: data.valid,
				message: data.reason || "Invalid search term"
			};
		} catch (err) {
			console.error("Validation error:", err);
			// If there's an error with the validation, we'll still allow the search
			return { valid: true, message: "" };
		}
	};

	const onSearch = async (term: string, isAiSuggestion = false) => {
		if (!term.trim()) {
			return;
		}

		// Validate the search term
		setValidationLoading(true);
		const validationResult = await validateSearchTerm(term);
		setValidationLoading(false);

		if (!validationResult.valid) {
			toast({
				title: "Invalid search",
				description: validationResult.message,
				variant: "destructive"
			});
			return;
		}

		setSearchLoading(true);
		setError(null);

		try {
			// When a user selects an AI suggestion or submits a search,
			// we want to create a new entry for that exact phrase rather than
			// redirecting to a partial match
			const exactMatch = true;

			const result = await searchGuide(term, exactMatch);

			if (result.success && result.data) {
				router.push(`/${encodeURIComponent(result.data.searchTerm)}`);
			} else {
				setError(result.error || "An error occurred while searching");
			}
		} catch (err) {
			console.error("Search error:", err);
			setError("An unexpected error occurred. Please try again.");
		} finally {
			setSearchLoading(false);
		}
	};

	// Only show suggestions if we have results or an error
	// Don't show during initial loading with no results
	const shouldShowSuggestions = Boolean(
		(suggestionsLoading && (results.length > 0 || aiSuggestions.length > 0)) || // Only show loader if we already had results
		(!suggestionsLoading && (results.length > 0 || aiSuggestions.length > 0)) || // Show when we have results
		error // Show when we have an error
	);

	// Handle keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Always allow Enter to submit if there's a search term, regardless of loading state
		if (e.key === "Enter" && search && !searchLoading && !validationLoading) {
			e.preventDefault();
			void onSearch(search);
			return;
		}

		// Don't handle navigation keys if no suggestions are shown
		if (!open || !shouldShowSuggestions) {
			return;
		}

		const totalItems = results.length + aiSuggestions.length + (search ? 1 : 0);

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
				if (selectedIndex >= 0 && !searchLoading && !validationLoading) {
					if (selectedIndex < results.length) {
						void onSearch(results[selectedIndex].searchTerm);
					} else if (selectedIndex < results.length + aiSuggestions.length) {
						void onSearch(aiSuggestions[selectedIndex - results.length]);
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
							disabled={searchLoading || validationLoading}
						/>
						{/* Search icon and loader container with transitions between them */}
						<div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
							<AnimatePresence mode="wait">
								{(suggestionsLoading && !shouldShowSuggestions) ? (
									<motion.div
										key="loader"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.2 }}
									>
										<Loader2 className="h-4 w-4 animate-spin text-green-500" />
									</motion.div>
								) : (
									<motion.div
										key="search-icon"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.2 }}
									>
										<Search className="h-4 w-4 text-green-500/60" />
									</motion.div>
								)}
							</AnimatePresence>
						</div>
						{/* Show submit button when there's text */}
						<AnimatePresence mode="wait">
							{search && (
								<motion.div
									initial={{ opacity: 0, x: -20, y: "-50%" }}
									animate={{ opacity: 1, x: 0, y: "-50%" }}
									exit={{ opacity: 0, x: -10, y: "-50%" }}
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
											disabled={searchLoading || validationLoading || !search.trim()}
										>
											<AnimatePresence mode="wait">
												{(searchLoading || validationLoading) ? (
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
						<>
							{results.length > 0 && (
								<CommandGroup heading="Suggestions">
									{results.map((result, index) => (
										<SearchResultItem
											key={result.id}
											result={result}
											index={index}
											isSelected={selectedIndex === index}
											onSelect={() => !searchLoading && !validationLoading && void onSearch(result.searchTerm)}
										/>
									))}
								</CommandGroup>
							)}

							{aiSuggestions.length > 0 && (
								<CommandGroup heading="Did you mean...">
									{aiSuggestions.map((suggestion, index) => (
										<CommandItem
											key={`ai-suggestion-${suggestion}`}
											value={suggestion}
											onSelect={() => !searchLoading && !validationLoading && void onSearch(suggestion)}
											className={cn(
												"flex cursor-pointer items-center justify-between gap-1 rounded border border-transparent p-3 text-green-400 aria-selected:border-green-500/40 aria-selected:bg-green-500/10",
												selectedIndex === results.length + index && "border-green-500/40 bg-green-500/10"
											)}
											id={`search-item-${results.length + index}`}
										>
											<div className="flex items-center">
												<span>{suggestion}</span>
											</div>
											{selectedIndex === results.length + index && (
												<kbd className="ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-green-500/30 bg-green-500/10 px-1.5 font-mono text-[10px] font-medium text-green-400 opacity-70">
													Enter
												</kbd>
											)}
										</CommandItem>
									))}
								</CommandGroup>
							)}

							{search && (
								<CommandItem
									value={search}
									onSelect={() => !searchLoading && !validationLoading && void onSearch(search)}
									className={cn(
										"flex cursor-pointer items-center justify-between gap-1 rounded border border-transparent p-3 text-green-400 aria-selected:border-green-500/40 aria-selected:bg-green-500/10",
										selectedIndex === results.length + aiSuggestions.length && "border-green-500/40 bg-green-500/10"
									)}
									id={`search-item-${results.length + aiSuggestions.length}`}
								>
									<div className="flex items-center">
										<Search className="mr-2 h-4 w-4" />
										<span>Search for "{search}"</span>
									</div>
									{selectedIndex === results.length + aiSuggestions.length && (
										<kbd className="ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-green-500/30 bg-green-500/10 px-1.5 font-mono text-[10px] font-medium text-green-400 opacity-70">
											Enter
										</kbd>
									)}
								</CommandItem>
							)}
						</>
					)}
				</Command>
			</PopoverContent>
		</Popover>
	);
}
