"use client";

import { Link } from "@/components/primitives/link-with-transition";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LOCAL_STORAGE_KEYS } from "@/config/local-storage-keys";
import { cn } from "@/lib/utils";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { DialogTitle } from "@radix-ui/react-dialog";
import { StarFilledIcon, StarIcon } from "@radix-ui/react-icons";
import {
	ArrowUpRight, BoxSelectIcon, DollarSign, FileIcon, Hash,
	ImageIcon,
	KeyRound,
	LayoutTemplate,
	LineChart, Palette, Ruler,
	Search, TerminalIcon,
	Timer
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

type ToolCategory =
	| "Formatters"
	| "Testing"
	| "Generators"
	| "Converters"
	| "Security"
	| "Design"
	| "AI";

interface Tool {
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	href: string;
	isExternal?: boolean;
	category: ToolCategory;
	keywords: string[];
}

const tools: Tool[] = [
	// https://www.openstatus.dev/play/curl
	{
		title: "cURL Builder",
		description: "An online curl command line builder. Generate curl commands to test your API endpoints.",
		icon: TerminalIcon,
		href: "https://www.openstatus.dev/play/curl",
		isExternal: true,
		category: "Testing",
		keywords: ["curl", "api", "testing", "performance", "speed"],
	},
	// https://www.openstatus.dev/play/checker
	{
		title: "Global Speed Checker",
		description: "Is your endpoint globally fast? Test your website and API performance across all continents.",
		icon: TerminalIcon,
		href: "https://www.openstatus.dev/play/checker",
		isExternal: true,
		category: "Testing",
		keywords: ["api", "testing", "performance", "speed"],
	},
	// https://shipixen.com/shadcn-pricing-page
	{
		title: "Shadcn Pricing Page",
		description: "A pricing page for Shadcn UI",
		icon: DollarSign,
		href: "https://shipixen.com/shadcn-pricing-page",
		isExternal: true,
		category: "Generators",
		keywords: ["pricing", "page", "shadcn", "ui", "generator"],
	},
	// https://ui.aceternity.com/tools/box-shadows
	{
		title: "Box Shadows",
		description: "Generate box shadows for your UI components",
		icon: BoxSelectIcon,
		href: "https://ui.aceternity.com/tools/box-shadows",
		isExternal: true,
		category: "Design",
		keywords: ["box", "shadow", "ui", "component", "design"],
	},
	// https://socialscreenshots.com/editor
	{
		title: "Social Screenshots",
		description: "Create social media screenshots",
		icon: ImageIcon,
		href: "https://socialscreenshots.com/editor",
		isExternal: true,
		category: "Design",
		keywords: ["social", "media", "screenshot", "editor", "design"],
	},
	// https://cursor.directory/
	{
		title: "Cursor Directory",
		description: "Find the best cursor rules for your framework and language",
		icon: TerminalIcon,
		href: "https://cursor.directory/",
		isExternal: true,
		category: "AI",
		keywords: ["ai", "tool", "directory", "find", "best", "project"],
	},

	// https://cursorlist.com/
	{
		title: "Cursor List",
		description: "Find the best cursor rules for your framework and language",
		icon: TerminalIcon,
		href: "https://cursorlist.com/",
		isExternal: true,
		category: "AI",
		keywords: ["ai", "tool", "directory", "find", "best", "project"],
	},
	// https://uicolors.app/create
	{
		title: "Color Palette Generator",
		description: "Generate a color palette from an image",
		icon: Palette,
		href: "https://uicolors.app/create",
		isExternal: true,
		category: "Design",
		keywords: ["color", "palette", "generator", "image", "ui", "design"],
	},
	{
		title: "Shadcn Form Builder",
		description: "Shadcn Form is a library for building forms with Shadcn UI components.",
		icon: FileIcon,
		href: "https://www.shadcn-form.com/",
		isExternal: true,
		category: "Generators",
		keywords: ["form", "shadcn", "ui", "library", "component"],
	},
	{
		title: "CSS Easing",
		description: "Visual easing function generator for animations",
		icon: LineChart,
		href: "https://originui.com/easings",
		isExternal: true,
		category: "Design",
		keywords: [
			"animation",
			"transition",
			"timing",
			"curve",
			"bezier",
			"motion",
			"css",
			"ease-in",
			"ease-out",
			"ease-in-out",
			"cubic-bezier",
			"animation-timing",
			"keyframes",
			"smooth",
			"interpolation",
		],
	},
	{
		title: "RegEx Tester",
		description: "Test and debug your regular expressions",
		icon: Ruler,
		href: "https://regexr.com/",
		isExternal: true,
		category: "Testing",
		keywords: [
			"regex",
			"regular expression",
			"pattern",
			"match",
			"test",
			"debug",
			"capture groups",
			"flags",
			"substitution",
			"replace",
			"pcre",
			"javascript",
			"python",
			"php",
		],
	},
	{
		title: "Cron Expression Generator",
		description: "Generate and validate cron expressions",
		icon: Timer,
		href: "https://crontab.guru/",
		isExternal: true,
		category: "Generators",
		keywords: [
			"cron",
			"schedule",
			"time",
			"expression",
			"job",
			"task",
			"linux",
			"unix",
			"scheduler",
			"automation",
			"periodic",
			"interval",
			"recurring",
		],
	},
	{
		title: "Hash Generator",
		description: "Generate various hash types",
		icon: Hash,
		href: "https://passwordsgenerator.net/sha256-hash-generator/",
		isExternal: true,
		category: "Security",
		keywords: [
			"hash",
			"md5",
			"sha",
			"sha256",
			"encrypt",
			"security",
			"sha1",
			"sha512",
			"checksum",
			"digest",
			"cryptography",
			"verification",
		],
	},
	{
		title: "JWT Debugger",
		description: "Debug and verify JWT tokens",
		icon: KeyRound,
		href: "https://jwt.io/",
		isExternal: true,
		category: "Security",
		keywords: [
			"jwt",
			"token",
			"debug",
			"verify",
			"auth",
			"authentication",
			"json web token",
			"decode",
			"claims",
			"header",
			"payload",
			"signature",
			"bearer",
		],
	},
	{
		title: "CSS Grid Generator",
		description: "Visual grid layout builder",
		icon: LayoutTemplate,
		href: "https://cssgrid-generator.netlify.app/",
		isExternal: true,
		category: "Design",
		keywords: [
			"css",
			"grid",
			"layout",
			"generator",
			"visual",
			"design",
			"responsive",
			"columns",
			"rows",
			"template",
			"areas",
			"gap",
			"flexbox",
		],
	},
];

const STORAGE_KEY = LOCAL_STORAGE_KEYS.starredTools;

export const ToolsSection = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<
		ToolCategory | "all"
	>("all");
	const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
	const [starredTools, setStarredTools] = useState<Set<string>>(new Set());
	const [showStarredOnly, setShowStarredOnly] = useState(false);

	const [parent] = useAutoAnimate({
		duration: 150,
		easing: "ease-in-out",
	});

	// Load starred tools from localStorage on mount
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			setStarredTools(new Set(JSON.parse(stored)));
		}
	}, []);

	// Save starred tools to localStorage when changed
	const toggleStar = (toolTitle: string) => {
		setStarredTools((prev) => {
			const next = new Set(prev);
			if (next.has(toolTitle)) {
				next.delete(toolTitle);
			} else {
				next.add(toolTitle);
			}
			localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
			return next;
		});
	};

	// Get unique categories
	const categories = [
		"all",
		...new Set(tools.map((tool) => tool.category)),
	] as const;

	// Filter tools based on search query, category, and starred status
	const filteredTools = tools.filter((tool) => {
		const searchTerms = searchQuery.toLowerCase().split(" ");
		const matchesSearch = searchTerms.every(term =>
			tool.title.toLowerCase().includes(term) ||
			tool.description.toLowerCase().includes(term) ||
			tool.keywords.some(keyword => keyword.toLowerCase().includes(term))
		);
		const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
		const matchesStarred = !showStarredOnly || starredTools.has(tool.title);
		return matchesSearch && matchesCategory && matchesStarred;
	});

	// Sort tools with starred items first
	const sortedAndFilteredTools = filteredTools.sort((a, b) => {
		const aIsStarred = starredTools.has(a.title);
		const bIsStarred = starredTools.has(b.title);

		if (aIsStarred && !bIsStarred) return -1;
		if (!aIsStarred && bIsStarred) return 1;

		// Secondary sort by category
		return a.category.localeCompare(b.category);
	});

	return (
		<div className="space-y-6">
			{/* Search and Filter */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 gap-4">
					<div className="relative w-full sm:w-[300px]">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search tools..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowStarredOnly(!showStarredOnly)}
						className={cn(
							"gap-2 whitespace-nowrap",
							showStarredOnly &&
							"bg-primary text-primary-foreground hover:bg-primary/90",
						)}
					>
						<StarIcon className="h-4 w-4" />
						{showStarredOnly ? "Show All" : "Show Starred"}
					</Button>
				</div>
				{starredTools.size > 0 && (
					<div className="text-sm text-muted-foreground">
						{starredTools.size} starred tool{starredTools.size !== 1 ? "s" : ""}
					</div>
				)}
			</div>

			{/* Category Filter */}
			<div className="flex flex-wrap gap-2">
				{categories.map((category) => (
					<Button
						key={category}
						variant={selectedCategory === category ? "default" : "outline"}
						size="sm"
						onClick={() => setSelectedCategory(category)}
						className="capitalize"
					>
						{category}
					</Button>
				))}
			</div>

			{/* Tools Grid */}
			<div ref={parent} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{sortedAndFilteredTools.map((tool) => (
					<div key={tool.title} className="group">
						<Card
							className="cursor-pointer transition-colors hover:bg-muted/50 group"
							onClick={() => setSelectedTool(tool)}
						>
							<ToolCardContent
								tool={tool}
								isStarred={starredTools.has(tool.title)}
								onToggleStar={(e) => {
									e.stopPropagation();
									toggleStar(tool.title);
								}}
							/>
						</Card>

					</div>
				))}
			</div>

			{/* Embedded Tool Dialog */}
			<Dialog open={!!selectedTool} onOpenChange={() => setSelectedTool(null)}>
				<DialogContent className="max-w-6xl">
					<DialogHeader>
						<DialogTitle className="sr-only">
							{selectedTool?.title ?? "Tool Details"}
						</DialogTitle>
					</DialogHeader>
					<div className="flex items-center justify-between border-b pb-2">
						<div className="flex items-center gap-2">
							{selectedTool?.icon && (
								<selectedTool.icon className="h-5 w-5 text-primary" />
							)}
							<h2 className="text-lg font-semibold">{selectedTool?.title}</h2>
						</div>
						<div className="flex items-center gap-2">
							{selectedTool && (
								<Button
									variant="ghost"
									size="icon"
									onClick={(e) => {
										e.stopPropagation();
										toggleStar(selectedTool.title);
									}}
								>
									{starredTools.has(selectedTool.title) ? (
										<StarFilledIcon className="h-4 w-4 fill-primary text-primary" />
									) : (
										<StarIcon
											className="h-4 w-4 text-muted-foreground"
										/>
									)}
								</Button>
							)}
						</div>
					</div>
					{selectedTool?.href && (
						<div className="aspect-video w-full">
							<iframe
								src={selectedTool.href}
								className="h-full w-full rounded-md border-none"
								title={selectedTool.title}
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
};

// Helper component for tool card content
const ToolCardContent = ({
	tool,
	isStarred,
	onToggleStar,
}: {
	tool: Tool;
	isStarred: boolean;
	onToggleStar: (e: React.MouseEvent) => void;
}) => (
	<>
		<CardHeader>
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<div className="rounded-md bg-primary/10 p-2 group-hover:bg-primary/20">
						<tool.icon className={cn("h-5 w-5 text-primary")} />
					</div>
					<div>
						<CardTitle className="text-base">{tool.title}</CardTitle>
						<div className="text-xs text-muted-foreground">
							<span className="capitalize">{tool.category}</span>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={onToggleStar}
					>
						{isStarred ? (
							<StarFilledIcon className="h-4 w-4 fill-primary text-primary" />
						) : (
							<StarIcon className="h-4 w-4 text-muted-foreground" />
						)}
					</Button>
					<Link
						href={tool.href}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						className={"inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"}
					>
						<ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
						<span className="sr-only">Open {tool.title} in new tab</span>
					</Link>
				</div>
			</div>
		</CardHeader>
		<CardContent>
			<CardDescription>{tool.description}</CardDescription>
			<div className="mt-2 flex flex-wrap gap-1">
				{tool.keywords.map((keyword) => (
					<span
						key={keyword}
						className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
					>
						{keyword}
					</span>
				))}
			</div>
		</CardContent>
	</>
);
