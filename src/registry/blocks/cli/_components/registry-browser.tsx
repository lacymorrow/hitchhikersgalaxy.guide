"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch"; // Import Switch component
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { type Registry, type RegistryItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CodeIcon } from "@radix-ui/react-icons";
import {
	BookOpen,
	Check,
	ChevronsUpDown,
	Download,
	FileCode,
	Filter,
	Link,
	Loader2,
	Trash2,
	X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import {
	getInstalledComponents,
	getProjectRoot,
	installComponent,
} from "../actions";
import {
	addCustomRegistry,
	categorizeItems,
	fetchItemDetails,
	fetchRegistryIndex,
	getRegistries,
	removeCustomRegistry,
} from "../lib/registry-service";
import { AddRegistryDialog } from "./add-registry-dialog";
import { BlockPreview } from "./block-preview";
import { ComponentStats } from "./component-stats";
import { CopyButton } from "./copy-button";
import { FileTree } from "./file-tree";
import { Preview } from "./preview";
import { Terminal as TerminalComponent } from "./terminal";

interface RegistryBrowserProps {
	defaultRegistry?: string;
}

export function RegistryBrowser({ defaultRegistry }: RegistryBrowserProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { toast } = useToast();
	const [isPending, startTransition] = useTransition();

	// State
	const [registries, setRegistries] = useState<Registry[]>([]);
	const [selectedRegistry, setSelectedRegistry] = useState<Registry | null>(
		null
	);
	const [registryItems, setRegistryItems] = useState<RegistryItem[]>([]);
	const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(null);
	const [itemDetails, setItemDetails] = useState<RegistryItem | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<"all" | "components" | "blocks">(
		"all"
	);
	const [filterCategory, setFilterCategory] = useState<string>("all");
	const [open, setOpen] = useState(false);
	const [installing, setInstalling] = useState(false);
	const [installOutput, setInstallOutput] = useState<string[]>([]);
	const [overwrite, setOverwrite] = useState(false);
	const [selectedFile, setSelectedFile] = useState<string>();
	const [docsUrl, setDocsUrl] = useState<string | null>(null);
	const [checkingDocs, setCheckingDocs] = useState(false);
	const [installedComponents, setInstalledComponents] = useState<string[]>([]);

	// Load registries
	useEffect(() => {
		const loadRegistries = async () => {
			try {
				const regs = await getRegistries();
				setRegistries(regs);

				// Set default registry
				if (defaultRegistry) {
					const defaultReg = regs.find((r) => r.name === defaultRegistry);
					if (defaultReg) {
						setSelectedRegistry(defaultReg);
					}
				}
			} catch (error) {
				toast({
					title: "Error",
					description: "Failed to load registries",
					variant: "destructive",
				});
			}
		};
		loadRegistries();
	}, [defaultRegistry, toast]);

	// Load registry items when registry changes
	useEffect(() => {
		if (selectedRegistry) {
			startTransition(async () => {
				try {
					const items = await fetchRegistryIndex(selectedRegistry.url);
					setRegistryItems(items);
				} catch (error) {
					toast({
						title: "Error",
						description: "Failed to load registry items",
						variant: "destructive",
					});
				}
			});
		}
	}, [selectedRegistry, toast]);

	// Check if docs exist when item is selected
	useEffect(() => {
		if (!selectedItem || !selectedRegistry) return;

		const checkDocs = async () => {
			setCheckingDocs(true);
			try {
				// Construct potential docs URLs based on registry
				let url = "";
				if (selectedRegistry.name === "Magic UI") {
					url = `https://magicui.design/docs/components/${selectedItem.name}`;
				} else if (selectedRegistry.name === "shadcn/ui") {
					url = `https://ui.shadcn.com/docs/components/${selectedItem.name}`;
				}

				if (!url) {
					setDocsUrl(null);
					return;
				}

				// Test if the docs exist
				const response = await fetch(url, { method: "HEAD" });
				setDocsUrl(response.ok ? url : null);
			} catch (error) {
				setDocsUrl(null);
			} finally {
				setCheckingDocs(false);
			}
		};

		checkDocs();
	}, [selectedItem, selectedRegistry]);

	// Load installed components
	useEffect(() => {
		const loadInstalledComponents = async () => {
			try {
				const projectRoot = await getProjectRoot();
				const components = await getInstalledComponents(projectRoot);
				setInstalledComponents(components);
			} catch (error) {
				console.error("Failed to load installed components:", error);
			}
		};

		loadInstalledComponents();
	}, []);

	// Refresh installed components after installation
	useEffect(() => {
		if (!installing) {
			const refreshComponents = async () => {
				try {
					const projectRoot = await getProjectRoot();
					const components = await getInstalledComponents(projectRoot);
					setInstalledComponents(components);
				} catch (error) {
					console.error("Failed to refresh installed components:", error);
				}
			};

			refreshComponents();
		}
	}, [installing]);

	// Handle item selection
	const handleItemSelect = useCallback(
		async (item: RegistryItem) => {
			setSelectedItem(item);
			if (!selectedRegistry) return;

			startTransition(async () => {
				try {
					const details = await fetchItemDetails(
						item.type === "registry:block"
							? selectedRegistry.baseBlockUrl!
							: selectedRegistry.baseComponentUrl!,
						item.name
					);
					setItemDetails(details);
				} catch (error) {
					toast({
						title: "Error",
						description: "Failed to load item details",
						variant: "destructive",
					});
				}
			});
		},
		[selectedRegistry, toast]
	);

	// Handle installation
	const handleInstall = useCallback(async () => {
		if (!selectedItem || !itemDetails) return;

		setInstalling(true);
		setInstallOutput([]);

		try {
			const projectRoot = await getProjectRoot();
			const response = await installComponent(
				itemDetails.componentUrl ||
				`${selectedRegistry?.baseComponentUrl}/styles/default/${selectedItem.name}.json`,
				projectRoot,
				overwrite
			);
			const reader = response.getReader();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = new TextDecoder().decode(value);
				setInstallOutput((prev) => [...prev, chunk]);
			}

			toast({
				title: "Success",
				description: `Successfully installed ${selectedItem.name}`,
			});
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to install component",
				variant: "destructive",
			});
		} finally {
			setInstalling(false);
		}
	}, [selectedItem, itemDetails, overwrite, toast]);

	// Filter items based on search query and filters
	const filteredItems = useMemo(() => {
		if (!registryItems?.length) return [];

		return registryItems.filter((item) => {
			// Filter by type
			if (filterType !== "all") {
				if (filterType === "components" && item.type !== "registry:ui")
					return false;
				if (filterType === "blocks" && item.type !== "registry:block")
					return false;
			}

			// Filter by category
			if (filterCategory !== "all" && item?.category !== filterCategory) {
				return false;
			}

			// Filter by search query
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				return (
					item.name.toLowerCase().includes(query) ||
					item.description?.toLowerCase().includes(query) ||
					false
				);
			}

			return true;
		});
	}, [registryItems, filterType, filterCategory, searchQuery]);

	// Group items by category
	const groupedItems = useMemo(() => {
		if (!filteredItems?.length) return {};
		return categorizeItems(filteredItems);
	}, [filteredItems]);

	return (
		<div className="grid h-[800px] grid-cols-[300px_1fr] gap-6">
			{/* Left sidebar */}
			<div className="flex flex-col gap-4">
				{/* Registry selector */}
				<div className="space-y-2">
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								aria-expanded={open}
								className="justify-between w-full"
								disabled={!registries.length}
							>
								{selectedRegistry?.name ?? "Select registry..."}
								<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="p-0">
							<Command>
								<CommandList>
									<CommandInput placeholder="Search registries..." />
									<CommandEmpty>No registry found.</CommandEmpty>
									<CommandGroup heading="Built-in Registries">
										{registries
											.filter((r) => !r.custom)
											.map((registry) => (
												<CommandItem
													key={registry.name}
													onSelect={() => {
														setSelectedRegistry(registry);
														setOpen(false);
														setSelectedItem(null);
														setItemDetails(null);
														setRegistryItems([]);
														setSearchQuery("");
														setFilterType("all");
														setFilterCategory("all");
													}}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															selectedRegistry?.name === registry.name
																? "opacity-100"
																: "opacity-0"
														)}
													/>
													{registry.name}
												</CommandItem>
											))}
									</CommandGroup>
									<CommandGroup heading="Custom Registries">
										{registries
											.filter((r) => r.custom)
											.map((registry) => (
												<CommandItem
													key={registry.name}
													onSelect={() => {
														setSelectedRegistry(registry);
														setOpen(false);
														setSelectedItem(null);
														setItemDetails(null);
														setRegistryItems([]);
														setSearchQuery("");
														setFilterType("all");
														setFilterCategory("all");
													}}
													className="flex justify-between"
												>
													<div className="flex items-center">
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																selectedRegistry?.name === registry.name
																	? "opacity-100"
																	: "opacity-0"
															)}
														/>
														{registry.name}
													</div>
													<Button
														variant="ghost"
														size="sm"
														className="h-4 w-4 p-0"
														onClick={(e) => {
															e.stopPropagation();
															if (selectedRegistry?.name === registry.name) {
																setSelectedRegistry(null);
															}
															removeCustomRegistry(registry.name);
															const updatedRegistries = registries.filter(
																(r) => r.name !== registry.name
															);
															setRegistries(updatedRegistries);
														}}
													>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</CommandItem>
											))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
					<AddRegistryDialog
						onAdd={(registry) => {
							addCustomRegistry({ ...registry, custom: true });
							setRegistries((prev) => [...prev, { ...registry, custom: true }]);
							setSelectedRegistry({ ...registry, custom: true });
							setOpen(false);
						}}
					/>
				</div>

				{/* Search and filters */}
				<div className="flex gap-2">
					<Input
						placeholder="Search components..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex-1"
					/>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline" size="icon">
								<Filter className="h-4 w-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-56" align="end">
							<Command>
								<CommandList>
									<CommandGroup heading="Type">
										<CommandItem onSelect={() => setFilterType("all")}>
											<Check
												className={cn(
													"mr-2 h-4 w-4",
													filterType === "all" ? "opacity-100" : "opacity-0"
												)}
											/>
											All
										</CommandItem>
										<CommandItem onSelect={() => setFilterType("components")}>
											<Check
												className={cn(
													"mr-2 h-4 w-4",
													filterType === "components"
														? "opacity-100"
														: "opacity-0"
												)}
											/>
											Components
										</CommandItem>
										<CommandItem onSelect={() => setFilterType("blocks")}>
											<Check
												className={cn(
													"mr-2 h-4 w-4",
													filterType === "blocks" ? "opacity-100" : "opacity-0"
												)}
											/>
											Blocks
										</CommandItem>
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>

				{/* Component list */}
				<div className="flex-1 overflow-hidden">
					<ScrollArea className="h-full">
						{Object.entries(groupedItems).map(([category, items]) => (
							<div key={category} className="mb-4">
								<h3 className="mb-2 text-sm font-semibold">{category}</h3>
								<div className="space-y-1">
									{items.map((item) => (
										<Button
											key={item.name}
											variant={
												selectedItem?.name === item.name ? "secondary" : "ghost"
											}
											className="w-full justify-start"
											onClick={() => handleItemSelect(item)}
										>
											<div className="flex items-center justify-between w-full">
												<span>{item.name}</span>
												{installedComponents.includes(item.name) && (
													<TooltipProvider delayDuration={0}>
														<Tooltip>
															<TooltipTrigger asChild>
																<Check className="h-4 w-4 text-green-500" />
															</TooltipTrigger>
															<TooltipContent>
																<p>Installed</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												)}
											</div>
										</Button>
									))}
								</div>
							</div>
						))}
					</ScrollArea>
				</div>
			</div>

			{/* Right content */}
			<div className="space-y-6">
				{itemDetails ? (
					<div className="space-y-6">
						{/* Title and Install Button */}
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<h3 className="text-lg font-semibold">{itemDetails.name}</h3>
								<p className="text-sm text-muted-foreground">
									{itemDetails.description}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<div className="flex items-center gap-2">
									<CopyButton
										value={
											itemDetails.componentUrl ||
											`${selectedRegistry?.baseComponentUrl}/styles/default/${selectedItem?.name}.json`
										}
										tooltip="Copy JSON URL"
										icon={Link}
										variant="outline"
									/>
									<span className="sr-only text-xs text-muted-foreground">
										JSON URL
									</span>
								</div>
								<div className="flex items-center gap-2">
									<CopyButton
										value={`npx shadcn@latest add "${itemDetails.componentUrl ||
											`${selectedRegistry?.baseComponentUrl}/styles/default/${selectedItem?.name}.json`
											}"`}
										tooltip="Copy Install Command"
										icon={CodeIcon}
										variant="outline"
									/>
									<span className="sr-only text-xs text-muted-foreground">
										Install Command
									</span>
								</div>
								{itemDetails.files?.some((f) => f.content) && (
									<div className="flex items-center gap-2">
										<CopyButton
											value={itemDetails.files
												.filter(
													(f) => f.content && !f.path.endsWith(".test.tsx")
												)
												.map((f) => f.content)
												.join("\n\n")}
											tooltip="Copy Component Code"
											icon={FileCode}
											variant="outline"
										/>
										<span className="sr-only text-xs text-muted-foreground">
											Code
										</span>
									</div>
								)}
								{docsUrl && (
									<div className="flex items-center gap-2">
										<TooltipProvider delayDuration={0}>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8"
														asChild
													>
														<a
															href={docsUrl}
															target="_blank"
															rel="noopener noreferrer"
															className="flex items-center justify-center"
														>
															<BookOpen className="h-4 w-4" />
															<span className="sr-only">
																View Documentation
															</span>
														</a>
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													<p>View Documentation</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
								)}
								<div className="flex items-center gap-4">
									{!installing && (
										<div className="flex items-center gap-2">
											<Switch
												id="overwrite"
												checked={overwrite}
												onCheckedChange={setOverwrite}
											/>
											<label
												htmlFor="overwrite"
												className="text-sm text-muted-foreground"
											>
												Overwrite existing
											</label>
										</div>
									)}
									<Button
										onClick={handleInstall}
										disabled={installing}
										variant={
											installedComponents.includes(selectedItem?.name || "")
												? "secondary"
												: "default"
										}
									>
										{installing ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Installing...
											</>
										) : installedComponents.includes(
											selectedItem?.name || ""
										) ? (
											<>
												<Download className="mr-2 h-4 w-4" />
												Reinstall
											</>
										) : (
											<>
												<Download className="mr-2 h-4 w-4" />
												Install
											</>
										)}
									</Button>
								</div>
							</div>
						</div>

						{/* Preview */}
						{itemDetails.type === "registry:block" ? (
							<BlockPreview block={itemDetails} />
						) : (
							<Preview item={itemDetails} />
						)}

						{/* Component Stats */}
						<ComponentStats selectedItem={itemDetails} />

						{/* File tree */}
						{itemDetails.files && (
							<Card className="p-4">
								<h3 className="mb-4 text-lg font-semibold">Files</h3>
								<FileTree
									files={itemDetails.files}
									selectedFile={selectedFile}
									onFileSelect={(file) => setSelectedFile(file.path)}
								/>
							</Card>
						)}
					</div>
				) : (
					<div className="flex h-full items-center justify-center">
						<p className="text-muted-foreground">
							Select a component to view details
						</p>
					</div>
				)}
			</div>

			{/* Installation output overlay */}
			{installOutput.length > 0 && (
				<div className="fixed bottom-4 right-4 w-[500px] animate-in slide-in-from-bottom duration-300">
					<Card className="shadow-2xl border-black/10 bg-[#1E1E1E]">
						<div className="relative">
							<div className="absolute top-0 left-0 right-0 h-8 bg-[#323233] rounded-t-lg flex items-center justify-between px-3">
								<div className="flex items-center gap-1.5">
									<div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
									<div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
									<div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
								</div>
								<div className="absolute inset-0 flex items-center justify-center">
									<span className="text-xs text-zinc-400 font-medium">
										Installation Output
									</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="relative z-10 h-6 w-6 p-0 text-zinc-400 hover:text-zinc-300"
									onClick={() => setInstallOutput([])}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<div className="pt-8">
								<div className="flex items-center px-4 py-2 bg-[#252526]">
									<div className="flex items-center gap-2 text-xs">
										{installing ? (
											<>
												<div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full">
													<Loader2 className="h-3 w-3 animate-spin" />
													Installing...
												</div>
											</>
										) : (
											<div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full">
												<Check className="h-3 w-3" />
												Complete
											</div>
										)}
									</div>
								</div>
								<TerminalComponent
									output={installOutput}
									className="h-[300px] rounded-b-lg"
								/>
							</div>
						</div>
					</Card>
				</div>
			)}
		</div>
	);
}
