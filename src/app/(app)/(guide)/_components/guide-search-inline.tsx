"use client";

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
import { Loader2, Search, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { SearchResultItem } from "./search-result-item";

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
	const [aiSuggestions, setAiSuggestions] = React.useState<string[]>([]);

	// Reset selected index when results change
	React.useEffect(() => {
		setSelectedIndex(-1);
	}, [results]);

	// Fetch suggestions (similar and AI) in parallel when debounced search term changes
	React.useEffect(() => {
		const fetchSuggestions = async () => {
			if (!debouncedSearch.trim()) {
				setResults([]);
				setAiSuggestions([]);
				setSuggestionsLoading(false);
				setError(null);
				return;
			}

			setSuggestionsLoading(true);
			setError(null); // Clear previous errors
			setResults([]); // Clear previous results immediately
			setAiSuggestions([]); // Clear previous AI suggestions immediately

			try {
				const similarSearchPromise = fetch(
					`/api/guide/search/similar?term=${encodeURIComponent(debouncedSearch)}`
				);
				const aiSuggestionsPromise =
					debouncedSearch.length >= 3
						? fetch(`/api/guide/search/suggestions?term=${encodeURIComponent(debouncedSearch)}`)
						: Promise.resolve(null); // Don't fetch AI suggestions if term is too short

				const [similarResponse, aiResponse] = await Promise.all([
					similarSearchPromise,
					aiSuggestionsPromise,
				]);

				let fetchedResults: GuideEntry[] = [];
				let fetchedAiSuggestions: string[] = [];
				const errors: string[] = [];

				// Process similar searches response
				if (similarResponse.ok) {
					fetchedResults = await similarResponse.json();
				} else {
					console.error(`Similar Search API error: ${similarResponse.status} ${similarResponse.statusText}`);
					errors.push(`Failed to fetch similar searches: ${similarResponse.status}`);
				}

				// Process AI suggestions response
				if (aiResponse) {
					if (aiResponse.ok) {
						const aiData = await aiResponse.json();
						fetchedAiSuggestions = aiData.suggestions || [];
					} else {
						// Non-critical error, log but don't block the user
						console.warn(`AI Suggestions API error: ${aiResponse.status} ${aiResponse.statusText}`);
					}
				}

				setResults(fetchedResults);
				setAiSuggestions(fetchedAiSuggestions);

				if (errors.length > 0) {
					setError(errors.join("; "));
				} else {
					setError(null); // Clear error if all requests succeeded
				}

			} catch (error) {
				console.error("Error fetching suggestions:", error);
				setResults([]);
				setAiSuggestions([]);
				setError(error instanceof Error ? error.message : "Failed to fetch suggestions");
			} finally {
				setSuggestionsLoading(false);
			}
		};

		void fetchSuggestions();
	}, [debouncedSearch]);

	// Validate search term using AI
	const validateSearchTerm = async (term: string): Promise<{ valid: boolean; message: string }> => {
		// Basic validation
		const normalizedTerm = term.trim().toLowerCase();
		if (!normalizedTerm) {
			return { valid: false, message: "Search term cannot be empty" };
		}

		if (normalizedTerm.length < 2) {
			return { valid: false, message: "Search term must be at least 2 characters" };
		}

		// Local regex checks for obvious gibberish
		const hasExcessiveSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{3,}/.test(normalizedTerm);
		const hasExcessiveNumbers = /\d{12,}/.test(normalizedTerm); // 4+ consecutive numbers
		// const isTooRandom = /[a-z]{5,}/.test(normalizedTerm); // 3+ uncommon letters together - This was too aggressive

		if (hasExcessiveSpecialChars || hasExcessiveNumbers /* || isTooRandom */) {
			return { valid: false, message: "Search term appears to be gibberish" };
		}

		// AI validation - Keep this part, but loading state is handled by searchLoading now
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
		console.log("[GuideSearchInline] onSearch started. Term:", term, "isAiSuggestion:", isAiSuggestion);

		// Validate the search term
		const validationResult = await validateSearchTerm(term);
		console.log("[GuideSearchInline] Validation result:", validationResult);

		if (!validationResult.valid) {
			toast({
				title: "Invalid search",
				description: validationResult.message,
				variant: "destructive"
			});
			console.log("[GuideSearchInline] Search term invalid, returning.");
			return;
		}

		setSearchLoading(true);
		setError(null);

		try {
			// When a user selects an AI suggestion or submits a search,
			// we want to create a new entry for that exact phrase rather than
			// redirecting to a partial match
			const exactMatch = true;

			console.log("[GuideSearchInline] Calling searchGuide with term:", term, "exactMatch:", exactMatch);
			const result = await searchGuide(term, exactMatch);
			console.log("[GuideSearchInline] searchGuide result:", result);

			if (result.success && result.data) {
				const path = `/${encodeURIComponent(result.data.searchTerm)}`;
				console.log("[GuideSearchInline] Navigating to path:", path);
				router.push(path);
			} else {
				const errorMessage = result.error || "An error occurred while searching the Guide.";
				console.error("[GuideSearchInline] searchGuide was not successful or data is missing. Error:", errorMessage);
				setError(errorMessage);
				toast({
					title: "Search Failed",
					description: errorMessage,
					variant: "destructive",
				});
			}
		} catch (err) {
			console.error("[GuideSearchInline] Error in onSearch try block:", err);
			setError("An unexpected error occurred. Please try again.");
		} finally {
			setSearchLoading(false);
		}
	};

	// Only show suggestions if we have results or an error
	// Don't show during initial loading with no results
	const shouldShowSuggestions = Boolean(
		open && // Popover must be requested to be open first
		(suggestionsLoading || results.length > 0 || aiSuggestions.length > 0 || error)
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
				if (selectedIndex >= 0 && !searchLoading) {
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
					{/* New structure: container with border, input, icon */}
					<div className="flex items-center border-b-2 border-[#70c8cd]/50 focus-within:border-[#70c8cd]">
						<Input
							ref={inputRef}
							placeholder="search..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setOpen(true);
							}}
							onKeyDown={handleKeyDown}
							className={cn(
								"border-none w-full bg-transparent py-4 px-2 font-mono text-xl text-[#70c8cd] placeholder:text-[#70c8cd]/50 focus:outline-none",
								"disabled:opacity-50"
							)}
							aria-expanded={open}
							aria-controls="search-suggestions"
							aria-activedescendant={selectedIndex >= 0 ? `search-item-${selectedIndex}` : undefined}
							role="combobox"
							aria-autocomplete="list"
							disabled={searchLoading}
						/>
						{/* Search icon or loader */}
						<button
							type="button"
							className={cn(
								"pr-2 flex items-center justify-center",
								"bg-transparent border-none p-0",
								search && !searchLoading ? "cursor-pointer hover:opacity-80" : "opacity-50 cursor-not-allowed"
							)}
							onClick={() => {
								if (search && !searchLoading) {
									void onSearch(search);
								}
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									if (search && !searchLoading) {
										e.preventDefault();
										void onSearch(search);
									}
								}
							}}
							disabled={!search || searchLoading}
							aria-label="Search"
						>
							<AnimatePresence mode="wait">
								{(suggestionsLoading || searchLoading) ? (
									<motion.div
										key="loader"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.2 }}
									>
										<Loader2 className="h-6 w-6 animate-spin text-[#70c8cd]/70" />
									</motion.div>
								) : (
									<motion.div
										key="search-icon"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.2 }}
									>
										<Search className="h-6 w-6 text-[#70c8cd]/70" />
									</motion.div>
								)}
							</AnimatePresence>
						</button>
					</div>
				</div>
			</PopoverTrigger>
			<PopoverContent
				className="w-[var(--radix-popover-trigger-width)] border border-cyan-400/40 bg-gray-950 p-0 shadow-lg shadow-cyan-500/5"
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
								<Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
								<p className="text-sm text-cyan-400/60">
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
											onSelect={() => !searchLoading && void onSearch(result.searchTerm)}
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
											onSelect={() => !searchLoading && void onSearch(suggestion, true)}
											className={cn(
												"flex cursor-pointer items-center justify-between gap-1 rounded border border-transparent p-3 text-cyan-300 aria-selected:border-cyan-400/40 aria-selected:bg-cyan-400/10 hover:bg-cyan-400/5",
												selectedIndex === results.length + index && "border-cyan-400/40 bg-cyan-400/10"
											)}
											id={`search-item-${results.length + index}`}
										>
											<div className="flex items-center">
												<span>{suggestion}</span>
											</div>
											{selectedIndex === results.length + index && (
												<kbd className="ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 font-mono text-[10px] font-medium text-cyan-400 opacity-70">
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
									onSelect={() => !searchLoading && void onSearch(search)}
									className={cn(
										"flex cursor-pointer items-center justify-between gap-1 rounded border border-transparent p-3 text-cyan-300 aria-selected:border-cyan-400/40 aria-selected:bg-cyan-400/10 hover:bg-cyan-400/5",
										selectedIndex === results.length + aiSuggestions.length && "border-cyan-400/40 bg-cyan-400/10"
									)}
									id={`search-item-${results.length + aiSuggestions.length}`}
								>
									<div className="flex items-center">
										<Search className="mr-2 h-4 w-4 text-cyan-400/80" />
										<span>Search for "{search}"</span>
									</div>
									{selectedIndex === results.length + aiSuggestions.length && (
										<kbd className="ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 font-mono text-[10px] font-medium text-cyan-400 opacity-70">
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
