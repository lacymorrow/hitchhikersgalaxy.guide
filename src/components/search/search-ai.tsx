"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { cn } from "@/lib/utils";
import { is } from "@/lib/utils/is";
import {
	BookOpen,
	ChevronDown,
	ChevronUp,
	Code,
	CornerRightDown,
	Frown,
	HelpCircle,
	Loader
} from "lucide-react";
import * as React from "react";
import ReactMarkdown from "react-markdown";

const MIN_HEIGHT = 64;
const MAX_HEIGHT = 200;
const MAX_AI_RESPONSE_HEIGHT = 400;

const SEARCH_SUGGESTIONS = [
	{
		text: "Documentation",
		icon: BookOpen,
		colors: {
			icon: "text-blue-600",
			border: "border-blue-500",
			bg: "bg-blue-100 dark:bg-blue-900/20",
		},
	},
	{
		text: "Code Examples",
		icon: Code,
		colors: {
			icon: "text-emerald-600",
			border: "border-emerald-500",
			bg: "bg-emerald-100 dark:bg-emerald-900/20",
		},
	},
	{
		text: "How To",
		icon: HelpCircle,
		colors: {
			icon: "text-purple-600",
			border: "border-purple-500",
			bg: "bg-purple-100 dark:bg-purple-900/20",
		},
	},
];

interface SearchResult {
	title: string;
	content: string;
	url: string;
}

export const SearchAi = ({ ...props }: ButtonProps) => {
	const [open, setOpen] = React.useState(false);
	const [query, setQuery] = React.useState<string>("");
	const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
	const [answer, setAnswer] = React.useState<string>("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [isSearchInProgress, setIsSearchInProgress] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [selectedSuggestion, setSelectedSuggestion] = React.useState<
		string | null
	>(null);
	const [isAIResponseExpanded, setIsAIResponseExpanded] = React.useState(false);

	const { textareaRef, adjustHeight } = useAutoResizeTextarea({
		minHeight: MIN_HEIGHT,
		maxHeight: MAX_HEIGHT,
	});

	const handleSearch = async () => {
		if (!query.trim() || isSearchInProgress) return;

		setIsSearchInProgress(true);
		setIsLoading(true);
		setError(null);
		setAnswer("");
		setIsAIResponseExpanded(false);

		try {
			// First, fetch search results
			const searchResponse = await fetch("/api/docs/search", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					query: query.trim(),
					limit: 5,
				}),
			});

			if (!searchResponse.ok) {
				throw new Error("Failed to fetch search results");
			}

			const { results } = await searchResponse.json();
			setSearchResults(results);

			// Then, start streaming the AI response
			const streamResponse = await fetch("/api/docs/search", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					query: `${selectedSuggestion ? `[${selectedSuggestion}] ` : ""}${query.trim()}`,
					limit: 5,
				}),
			});

			if (!streamResponse.ok) {
				throw new Error("Failed to fetch AI response");
			}

			// Read the stream
			const reader = streamResponse.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error("Failed to initialize stream reader");
			}

			let accumulatedAnswer = "";

			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					break;
				}

				// Decode and append the chunk
				const chunk = decoder.decode(value, { stream: true });
				accumulatedAnswer += chunk;
				setAnswer(accumulatedAnswer);
			}
		} catch (err) {
			console.error("Search error:", err);
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
			setIsSearchInProgress(false);
		}
	};

	const toggleSuggestion = (suggestionText: string) => {
		setSelectedSuggestion((prev) =>
			prev === suggestionText ? null : suggestionText,
		);
	};

	const currentSuggestion = selectedSuggestion
		? SEARCH_SUGGESTIONS.find((item) => item.text === selectedSuggestion)
		: null;

	const handleSubmit = () => {
		void handleSearch();
	};

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen(true);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const handleModalToggle = () => {
		setOpen(!open);
		setQuery("");
		setSearchResults([]);
		setAnswer("");
		setError(null);
		setSelectedSuggestion(null);
		setIsAIResponseExpanded(false);
	};

	return (
		<>
			<Button
				variant="outline"
				className={cn(
					"relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:max-w-40 lg:max-w-64",
				)}
				onClick={() => setOpen(true)}
				{...props}
			>
				<span className="hidden lg:inline-flex">Search docs...</span>
				<span className="inline-flex lg:hidden">Search...</span>
				<kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
					<span className="text-xs" suppressHydrationWarning>
						{is.mac() ? "⌘" : "Ctrl"}
					</span>K
				</kbd>
			</Button>

			<Dialog open={open} onOpenChange={handleModalToggle}>
				<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[850px]">
					<DialogHeader>
						<DialogTitle>Search Documentation</DialogTitle>
						<DialogDescription>
							Search through our documentation using AI-powered search.
						</DialogDescription>
					</DialogHeader>

					<div className="w-full py-4">
						<div className="relative mx-auto w-full max-w-full">
							<div className="relative rounded-2xl border border-black/10 bg-black/[0.03] focus-within:border-black/20 dark:border-white/10 dark:bg-white/[0.03] dark:focus-within:border-white/20">
								<div className="flex flex-col">
									<div
										className="overflow-y-auto"
										style={{ maxHeight: `${MAX_HEIGHT - 48}px` }}
									>
										<Textarea
											ref={textareaRef}
											placeholder="What would you like to know?"
											className={cn(
												"w-full max-w-full resize-none text-wrap rounded-2xl border-none bg-transparent pb-3 pr-10 pt-3 leading-[1.2] text-black placeholder:text-black/70 focus:ring focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white dark:placeholder:text-white/70",
												`min-h-[${MIN_HEIGHT}px]`,
											)}
											value={query}
											onChange={(e) => {
												setQuery(e.target.value);
												adjustHeight();
											}}
											onKeyDown={(e) => {
												if (e.key === "Enter" && !e.shiftKey) {
													e.preventDefault();
													handleSubmit();
												}
											}}
										/>
									</div>

									<div className="h-12 bg-transparent">
										{currentSuggestion && (
											<div className="absolute bottom-3 left-3 z-10">
												<button
													type="button"
													onClick={handleSubmit}
													disabled={isSearchInProgress}
													className={cn(
														"inline-flex items-center gap-1.5",
														"rounded-md border px-2 py-0.5 text-xs font-medium shadow-sm",
														"animate-fadeIn transition-colors duration-200",
														isSearchInProgress
															? "opacity-50 cursor-not-allowed"
															: "hover:bg-black/5 dark:hover:bg-white/5",
														currentSuggestion.colors.bg,
														currentSuggestion.colors.border,
													)}
												>
													<currentSuggestion.icon
														className={`h-3.5 w-3.5 ${currentSuggestion.colors.icon}`}
													/>
													<span className={currentSuggestion.colors.icon}>
														{selectedSuggestion}
													</span>
												</button>
											</div>
										)}
									</div>
								</div>

								<CornerRightDown
									className={cn(
										"absolute right-3 top-3 h-4 w-4 transition-all duration-200 dark:text-white",
										query ? "scale-100 opacity-100" : "scale-95 opacity-30",
									)}
								/>
							</div>
						</div>
						<div className="mx-auto mt-2 flex max-w-full flex-wrap justify-start gap-1.5">
							{SEARCH_SUGGESTIONS.filter(
								(item) => item.text !== selectedSuggestion,
							).map(({ text, icon: Icon, colors }) => (
								<button
									type="button"
									key={text}
									className={cn(
										"rounded-full px-3 py-1.5 text-xs font-medium",
										"border transition-all duration-200",
										"border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-gray-900 dark:hover:bg-white/5",
										"flex-shrink-0",
									)}
									onClick={() => toggleSuggestion(text)}
								>
									<div className="flex items-center gap-1.5">
										<Icon className={cn("h-4 w-4", colors.icon)} />
										<span className="whitespace-nowrap text-black/70 dark:text-white/70">
											{text}
										</span>
									</div>
								</button>
							))}
						</div>
					</div>

					{isLoading && (
						<div className="flex items-start gap-4">
							<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 p-2 dark:bg-slate-800">
								<Loader className="h-4 w-4 animate-spin" />
							</span>
							<p className="mt-0.5 text-slate-500">Searching...</p>
						</div>
					)}

					{error && (
						<div className="flex items-start gap-4">
							<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 p-2 dark:bg-red-900">
								<Frown className="h-4 w-4 text-red-600 dark:text-red-400" />
							</span>
							<p className="mt-0.5 text-red-600 dark:text-red-400">{error}</p>
						</div>
					)}

					{!error && (
						<div className="space-y-6">
							{/* Search Results Section */}
							{searchResults.length > 0 && (
								<div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
									<h4 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
										Related Documentation
									</h4>
									<ul className="space-y-2">
										{searchResults.map((result) => (
											<li key={result.url}>
												<a
													href={result.url}
													className="block rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800"
													onClick={handleModalToggle}
												>
													<h5 className="font-medium">{result.title}</h5>
													<p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
														{result.content}
													</p>
												</a>
											</li>
										))}
									</ul>
								</div>
							)}

							{/* AI Response Section */}
							{answer && (
								<div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
									<div className="mb-2 flex items-center justify-between">
										<h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">
											AI Answer
										</h4>
										<button
											type="button"
											onClick={() =>
												setIsAIResponseExpanded(!isAIResponseExpanded)
											}
											className="rounded-md p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
										>
											{isAIResponseExpanded ? (
												<ChevronUp className="h-4 w-4" />
											) : (
												<ChevronDown className="h-4 w-4" />
											)}
										</button>
									</div>
									<ScrollArea
										className={cn(
											"transition-all duration-200",
											isAIResponseExpanded
												? "max-h-[unset]"
												: `max-h-[${MAX_AI_RESPONSE_HEIGHT}px]`,
										)}
									>
										<div className="prose max-w-none dark:prose-invert">
											<ReactMarkdown>{answer}</ReactMarkdown>
										</div>
									</ScrollArea>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
};
