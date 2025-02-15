"use client";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAssetStore } from "../../store/asset-store";

interface VideoPreviewProps {
	url: string;
}

const VideoPreview = ({ url }: VideoPreviewProps) => {
	return (
		<video
			src={url}
			controls
			className="aspect-video w-full rounded-lg"
			controlsList="nodownload"
		/>
	);
};

interface AudioPreviewProps {
	url: string;
}

const AudioPreview = ({ url }: AudioPreviewProps) => {
	return (
		<audio src={url} controls className="w-full" controlsList="nodownload" />
	);
};

interface FontPreviewProps {
	url: string;
	name: string;
}

const FontPreview = ({ url, name }: FontPreviewProps) => {
	const [fontFamily, setFontFamily] = useState("");
	const [text, setText] = useState(
		"The quick brown fox jumps over the lazy dog",
	);

	useEffect(() => {
		// Load font
		const style = document.createElement("style");
		style.textContent = `
			@font-face {
				font-family: "${name}";
				src: url("${url}") format("${url.endsWith(".woff2")
				? "woff2"
				: url.endsWith(".woff")
					? "woff"
					: url.endsWith(".otf")
						? "opentype"
						: "truetype"
			}");
			}
		`;
		document.head.appendChild(style);
		setFontFamily(name);

		return () => {
			document.head.removeChild(style);
		};
	}, [url, name]);

	return (
		<div className="space-y-4">
			<Input
				value={text}
				onChange={(e) => setText(e.target.value)}
				className="font-inherit"
				style={{ fontFamily }}
			/>
			<div className="space-y-2">
				{[12, 16, 24, 32, 48].map((size) => (
					<p
						key={size}
						style={{ fontSize: size, fontFamily }}
						className="truncate"
					>
						{text || "The quick brown fox jumps over the lazy dog"}
					</p>
				))}
			</div>
		</div>
	);
};

interface ColorPreviewProps {
	color: string;
}

const ColorPreview = ({ color }: ColorPreviewProps) => {
	return (
		<div className="space-y-4">
			<div
				className="aspect-video w-full rounded-lg"
				style={{ backgroundColor: color }}
			/>
			<div className="flex items-center gap-2">
				<Input value={color} readOnly />
				<CopyButton value={color} />
			</div>
		</div>
	);
};

export const AssetPreview = () => {
	const { selectedAsset, selectAsset } = useAssetStore();

	if (!selectedAsset) return null;

	return (
		<Dialog open={!!selectedAsset} onOpenChange={() => selectAsset(null)}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between">
						<span>{selectedAsset.name}</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => selectAsset(null)}
						>
							<X className="h-4 w-4" />
						</Button>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Preview */}
					<div className="rounded-lg border bg-card p-4">
						{selectedAsset.type === "image" && (
							<img
								src={selectedAsset.url}
								alt={selectedAsset.name}
								className="w-full rounded-lg"
							/>
						)}
						{selectedAsset.type === "video" && (
							<VideoPreview url={selectedAsset.url} />
						)}
						{selectedAsset.type === "audio" && (
							<AudioPreview url={selectedAsset.url} />
						)}
						{selectedAsset.type === "font" && (
							<FontPreview url={selectedAsset.url} name={selectedAsset.name} />
						)}
						{selectedAsset.type === "color" && (
							<ColorPreview color={selectedAsset.url} />
						)}
					</div>

					{/* Metadata */}
					<div className="space-y-4 rounded-lg border bg-card p-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Type</Label>
								<p className="text-sm capitalize text-muted-foreground">
									{selectedAsset.type}
								</p>
							</div>
							{selectedAsset.metadata?.size && (
								<div>
									<Label>Size</Label>
									<p className="text-sm text-muted-foreground">
										{Math.round(selectedAsset.metadata.size / 1024)} KB
									</p>
								</div>
							)}
							{selectedAsset.metadata?.dimensions && (
								<div>
									<Label>Dimensions</Label>
									<p className="text-sm text-muted-foreground">
										{selectedAsset.metadata.dimensions.width} x{" "}
										{selectedAsset.metadata.dimensions.height}
									</p>
								</div>
							)}
							{selectedAsset.metadata?.duration && (
								<div>
									<Label>Duration</Label>
									<p className="text-sm text-muted-foreground">
										{selectedAsset.metadata.duration} seconds
									</p>
								</div>
							)}
						</div>

						{selectedAsset.tags.length > 0 && (
							<>
								<Separator />
								<div>
									<Label>Tags</Label>
									<div className="mt-2 flex flex-wrap gap-2">
										{selectedAsset.tags.map((tag) => (
											<span
												key={tag}
												className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
											>
												{tag}
											</span>
										))}
									</div>
								</div>
							</>
						)}
					</div>

					{/* Actions */}
					<div className="flex justify-end">
						<Button asChild>
							<a
								href={selectedAsset.url}
								download={selectedAsset.name}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Download className="mr-2 h-4 w-4" />
								Download
							</a>
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
