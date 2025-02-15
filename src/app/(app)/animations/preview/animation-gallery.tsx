"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Heart, Tag, X } from "lucide-react";
import { useState } from "react";
import { useAnimationStore } from "../store/animation-store";
import { type AnimationCategory, type AnimationMetadata } from "../types";

export const AnimationGallery = () => {
	const {
		animations,
		selectAnimation,
		favorites,
		tags,
		toggleFavorite,
		addTag,
		removeTag,
	} = useAnimationStore();
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<AnimationCategory | "all">("all");
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [newTag, setNewTag] = useState("");
	const [isAddingTag, setIsAddingTag] = useState(false);
	const [selectedAnimationId, setSelectedAnimationId] = useState<string | null>(
		null,
	);

	const filteredAnimations = animations.filter(
		(animation: AnimationMetadata) => {
			const matchesSearch =
				animation.title.toLowerCase().includes(search.toLowerCase()) ||
				animation.description.toLowerCase().includes(search.toLowerCase()) ||
				(tags[animation.id] ?? []).some((tag) =>
					tag.toLowerCase().includes(search.toLowerCase()),
				);
			const matchesCategory =
				category === "all" || animation.category === category;
			const matchesFavorites =
				!showFavoritesOnly || favorites.includes(animation.id);
			return matchesSearch && matchesCategory && matchesFavorites;
		},
	);

	const handleAddTag = (animationId: string) => {
		if (newTag.trim()) {
			addTag(animationId, newTag.trim());
			setNewTag("");
			setIsAddingTag(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<Input
					placeholder="Search animations..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-sm"
				/>
				<Select
					value={category}
					onValueChange={(value) =>
						setCategory(value as AnimationCategory | "all")
					}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Select category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
						<SelectItem value="auth">Authentication</SelectItem>
						<SelectItem value="database">Database</SelectItem>
						<SelectItem value="api">API</SelectItem>
						<SelectItem value="files">Files</SelectItem>
						<SelectItem value="users">Users</SelectItem>
						<SelectItem value="payments">Payments</SelectItem>
						<SelectItem value="email">Email</SelectItem>
						<SelectItem value="search">Search</SelectItem>
						<SelectItem value="cache">Cache</SelectItem>
						<SelectItem value="websocket">WebSocket</SelectItem>
					</SelectContent>
				</Select>

				<Button
					variant="outline"
					className={cn({
						"bg-primary text-primary-foreground": showFavoritesOnly,
					})}
					onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
				>
					<Heart
						className={cn("mr-2 h-4 w-4", {
							"fill-current": showFavoritesOnly,
						})}
					/>
					Favorites
				</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Category</TableHead>
						<TableHead>Duration</TableHead>
						<TableHead>Tags</TableHead>
						<TableHead className="w-[100px]">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredAnimations.map((animation) => (
						<TableRow
							key={animation.id}
							onClick={() => selectAnimation(animation)}
							className="group cursor-pointer transition-colors hover:bg-muted/50"
						>
							<TableCell>
								<span className="font-medium text-foreground group-hover:text-primary">
									{animation.title}
								</span>
							</TableCell>
							<TableCell>
								<Badge variant="secondary" className="capitalize">
									{animation.category}
								</Badge>
							</TableCell>
							<TableCell>{animation.duration}s</TableCell>
							<TableCell>
								<div className="flex flex-wrap gap-2">
									{(tags[animation.id] ?? []).map((tag) => (
										<Badge
											key={tag}
											variant="outline"
											className="flex items-center gap-1"
											onClick={(e) => {
												e.stopPropagation();
												removeTag(animation.id, tag);
											}}
										>
											{tag}
											<X className="h-3 w-3 cursor-pointer" />
										</Badge>
									))}
									{isAddingTag && selectedAnimationId === animation.id ? (
										<div
											className="flex items-center gap-2"
											onClick={(e) => e.stopPropagation()}
										>
											<Input
												value={newTag}
												onChange={(e) => setNewTag(e.target.value)}
												className="h-7 w-32"
												placeholder="New tag"
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														handleAddTag(animation.id);
													} else if (e.key === "Escape") {
														setIsAddingTag(false);
														setNewTag("");
													}
												}}
											/>
											<Button
												size="sm"
												onClick={() => handleAddTag(animation.id)}
											>
												Add
											</Button>
										</div>
									) : (
										<Button
											variant="ghost"
											size="sm"
											className="h-7 px-2"
											onClick={(e) => {
												e.stopPropagation();
												setIsAddingTag(true);
												setSelectedAnimationId(animation.id);
											}}
										>
											<Tag className="h-3 w-3" />
										</Button>
									)}
								</div>
							</TableCell>
							<TableCell>
								<Button
									variant="ghost"
									size="icon"
									onClick={(e) => {
										e.stopPropagation();
										toggleFavorite(animation.id);
									}}
								>
									<Heart
										className={cn("h-4 w-4", {
											"fill-current text-red-500": favorites.includes(
												animation.id,
											),
										})}
									/>
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
};
