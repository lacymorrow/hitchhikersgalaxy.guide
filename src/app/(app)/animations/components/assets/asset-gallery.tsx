"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Grid, List, Plus } from "lucide-react";
import { useState } from "react";
import { useAssetStore } from "../../store/asset-store";
import { type Asset } from "../../types";

interface AssetCardProps {
	asset: Asset;
	view: "grid" | "list";
	onSelect: (asset: Asset) => void;
}

const AssetCard = ({ asset, view, onSelect }: AssetCardProps) => {
	return (
		<div
			className={cn(
				"group relative cursor-pointer rounded-lg border bg-card p-2 transition-all hover:shadow-lg",
				view === "grid" ? "aspect-square" : "flex items-center gap-4",
			)}
			onClick={() => onSelect(asset)}
		>
			{/* Thumbnail */}
			<div
				className={cn(
					"relative overflow-hidden rounded-md bg-muted",
					view === "grid" ? "aspect-square" : "h-16 w-16",
				)}
			>
				{asset.thumbnailUrl ? (
					<img
						src={asset.thumbnailUrl}
						alt={asset.name}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-muted-foreground">
						{asset.type === "image" && "🖼️"}
						{asset.type === "video" && "🎥"}
						{asset.type === "audio" && "🎵"}
						{asset.type === "font" && "🔤"}
						{asset.type === "color" && (
							<div
								className="h-full w-full"
								style={{ backgroundColor: asset.url }}
							/>
						)}
					</div>
				)}
			</div>

			{/* Info */}
			<div className={cn("flex flex-col", view === "grid" ? "mt-2" : "flex-1")}>
				<span className="line-clamp-1 font-medium">{asset.name}</span>
				<span className="text-sm capitalize text-muted-foreground">
					{asset.type}
				</span>
				{view === "list" && (
					<div className="flex gap-2">
						{asset.tags.map((tag) => (
							<span
								key={tag}
								className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
							>
								{tag}
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export const AssetGallery = () => {
	const { assets, selectAsset } = useAssetStore();
	const [search, setSearch] = useState("");
	const [type, setType] = useState<Asset["type"] | "all">("all");
	const [view, setView] = useState<"grid" | "list">("grid");

	const filteredAssets = assets.filter((asset) => {
		const matchesSearch = asset.name
			.toLowerCase()
			.includes(search.toLowerCase());
		const matchesType = type === "all" || asset.type === type;
		return matchesSearch && matchesType;
	});

	return (
		<div className="space-y-4">
			{/* Controls */}
			<div className="flex items-center gap-4">
				<Input
					placeholder="Search assets..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-sm"
				/>
				<Select
					value={type}
					onValueChange={(value) => setType(value as Asset["type"] | "all")}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Filter by type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Types</SelectItem>
						<SelectItem value="image">Images</SelectItem>
						<SelectItem value="video">Videos</SelectItem>
						<SelectItem value="audio">Audio</SelectItem>
						<SelectItem value="font">Fonts</SelectItem>
						<SelectItem value="color">Colors</SelectItem>
					</SelectContent>
				</Select>

				<div className="ml-auto flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={() => setView("grid")}
						className={cn(
							view === "grid" && "bg-primary text-primary-foreground",
						)}
					>
						<Grid className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setView("list")}
						className={cn(
							view === "list" && "bg-primary text-primary-foreground",
						)}
					>
						<List className="h-4 w-4" />
					</Button>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Add Asset
					</Button>
				</div>
			</div>

			{/* Gallery */}
			<div
				className={cn(
					"grid gap-4",
					view === "grid"
						? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
						: "grid-cols-1",
				)}
			>
				{filteredAssets.map((asset) => (
					<AssetCard
						key={asset.id}
						asset={asset}
						view={view}
						onSelect={selectAsset}
					/>
				))}
			</div>

			{/* Empty State */}
			{filteredAssets.length === 0 && (
				<div className="flex h-[400px] items-center justify-center rounded-lg border bg-card">
					<div className="text-center">
						<p className="text-lg font-medium">No assets found</p>
						<p className="text-sm text-muted-foreground">
							Try adjusting your search or filters
						</p>
					</div>
				</div>
			)}
		</div>
	);
};
