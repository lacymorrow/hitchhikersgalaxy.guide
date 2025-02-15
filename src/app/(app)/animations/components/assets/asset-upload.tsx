"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadAsset } from "../../actions/assets";
import { useAssetStore } from "../../store/asset-store";
import type { Asset } from "../../types";

interface UploadPreviewProps {
	file: File;
	type: Asset["type"];
	onRemove: () => void;
}

const UploadPreview = ({ file, type, onRemove }: UploadPreviewProps) => {
	const [preview, setPreview] = useState<string>();

	// Generate preview for images
	if (type === "image" && !preview) {
		const reader = new FileReader();
		reader.onloadend = () => {
			setPreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	}

	return (
		<div className="relative">
			<div className="group relative aspect-square w-32 overflow-hidden rounded-lg border bg-muted">
				{preview ? (
					<img
						src={preview}
						alt={file.name}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-2xl">
						{type === "video" && "🎥"}
						{type === "audio" && "🎵"}
						{type === "font" && "🔤"}
					</div>
				)}
				<Button
					variant="destructive"
					size="icon"
					className="absolute right-2 top-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
					onClick={onRemove}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
			<p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
				{file.name}
			</p>
		</div>
	);
};

export const AssetUpload = () => {
	const { toast } = useToast();
	const { addAsset } = useAssetStore();
	const [type, setType] = useState<Exclude<Asset["type"], "color">>("image");
	const [files, setFiles] = useState<File[]>([]);
	const [tags, setTags] = useState("");
	const [isUploading, setIsUploading] = useState(false);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			// Filter files based on type
			const validFiles = acceptedFiles.filter((file) => {
				if (type === "image" && !file.type.startsWith("image/")) {
					return false;
				}
				if (type === "video" && !file.type.startsWith("video/")) {
					return false;
				}
				if (type === "audio" && !file.type.startsWith("audio/")) {
					return false;
				}
				if (
					type === "font" &&
					!["font/ttf", "font/otf", "font/woff", "font/woff2"].includes(
						file.type,
					)
				) {
					return false;
				}
				return true;
			});

			setFiles((prev) => [...prev, ...validFiles]);
		},
		[type],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": type === "image" ? [".jpg", ".jpeg", ".png", ".webp", ".gif"] : [],
			"video/*": type === "video" ? [".mp4", ".webm", ".mov"] : [],
			"audio/*": type === "audio" ? [".mp3", ".wav", ".ogg"] : [],
			// "font/*": type === "font" ? [".ttf", ".otf", ".woff", ".woff2"] : [],
		},
	});

	const handleUpload = async () => {
		try {
			setIsUploading(true);
			const tagArray = tags
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean);

			// Upload each file
			await Promise.all(
				files.map((file) =>
					uploadAsset(
						{
							file,
							type,
							tags: tagArray,
						},
						{
							resize:
								type === "image"
									? {
										width: 1920,
										height: 1080,
										maintainAspectRatio: true,
									}
									: undefined,
							compress:
								type === "image" ? { quality: 0.8, format: "webp" } : undefined,
						},
					),
				),
			);

			toast({
				title: "Upload successful",
				description: `Successfully uploaded ${files.length} file${files.length === 1 ? "" : "s"
					}`,
			});

			// Clear form
			setFiles([]);
			setTags("");
		} catch (error) {
			toast({
				title: "Upload failed",
				description:
					error instanceof Error
						? error.message
						: "An error occurred while uploading",
				variant: "destructive",
			});
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>
					<Upload className="mr-2 h-4 w-4" />
					Upload Assets
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Upload Assets</DialogTitle>
					<DialogDescription>
						Upload files to your asset library
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Asset Type */}
					<div className="space-y-2">
						<label htmlFor="asset-type" className="text-sm font-medium">
							Asset Type
						</label>
						<Select
							value={type}
							onValueChange={(value) => setType(value as Exclude<Asset["type"], "color">)}
							name="asset-type"
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="image">Image</SelectItem>
								<SelectItem value="video">Video</SelectItem>
								<SelectItem value="audio">Audio</SelectItem>
								<SelectItem value="font">Font</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Upload Area */}
					<div
						{...getRootProps()}
						className={cn(
							"flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
							isDragActive
								? "border-primary bg-primary/10"
								: "border-muted-foreground/25 hover:border-primary/50",
						)}
					>
						<input {...getInputProps()} />
						<Upload className="mb-4 h-8 w-8 text-muted-foreground" />
						<p className="text-center text-sm text-muted-foreground">
							Drag & drop files here, or click to select files
						</p>
					</div>

					{/* Preview */}
					{files.length > 0 && (
						<div className="grid grid-cols-3 gap-4">
							{files.map((file) => (
								<UploadPreview
									key={`${file.name}-${file.size}-${file.lastModified}`}
									file={file}
									type={type}
									onRemove={() =>
										setFiles((prev) => prev.filter((f) => f !== file))
									}
								/>
							))}
						</div>
					)}

					{/* Tags */}
					<div className="space-y-2">
						<label htmlFor="tags" className="text-sm font-medium">
							Tags (comma separated)
						</label>
						<Input
							id="tags"
							value={tags}
							onChange={(e) => setTags(e.target.value)}
							placeholder="logo, brand, hero..."
						/>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => {
								setFiles([]);
								setTags("");
							}}
						>
							Clear
						</Button>
						<Button
							onClick={handleUpload}
							disabled={files.length === 0 || isUploading}
						>
							{isUploading ? "Uploading..." : "Upload"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
