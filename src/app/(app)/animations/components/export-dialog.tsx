import { exportAnimation } from "@/app/(app)/animations/services/export-service";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { type AnimationMetadata } from "../types";

interface Props {
	animation: AnimationMetadata;
	isOpen: boolean;
	onClose: () => void;
}

export const ExportDialog = ({ animation, isOpen, onClose }: Props) => {
	const [format, setFormat] = useState<"mp4" | "gif" | "webm">("mp4");
	const [quality, setQuality] = useState<"draft" | "preview" | "production">(
		"production",
	);
	const [fps, setFps] = useState(animation.fps);
	const [width, setWidth] = useState(animation.width);
	const [height, setHeight] = useState(animation.height);
	const [startFrame, setStartFrame] = useState(0);
	const [endFrame, setEndFrame] = useState(animation.duration * animation.fps);
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async () => {
		try {
			setIsExporting(true);
			const downloadUrl = await exportAnimation(animation, {
				format,
				quality,
				fps,
				width,
				height,
				startFrame,
				endFrame,
			});

			// Create a temporary link to trigger download
			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = `${animation.id}-${Date.now()}.${format}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			onClose();
		} catch (error) {
			console.error("Export failed:", error);
			// TODO: Show error toast
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Export Animation</DialogTitle>
					<DialogDescription>
						Configure export settings for your animation.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<label className="text-right">Format</label>
						<Select
							value={format}
							onValueChange={(value) =>
								setFormat(value as "mp4" | "gif" | "webm")
							}
						>
							<SelectTrigger className="col-span-3">
								<SelectValue placeholder="Select format" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="mp4">MP4 Video</SelectItem>
								<SelectItem value="gif">Animated GIF</SelectItem>
								<SelectItem value="webm">WebM Video</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<label className="text-right">Quality</label>
						<Select
							value={quality}
							onValueChange={(value) =>
								setQuality(value as "draft" | "preview" | "production")
							}
						>
							<SelectTrigger className="col-span-3">
								<SelectValue placeholder="Select quality" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="draft">Draft (Faster)</SelectItem>
								<SelectItem value="preview">Preview</SelectItem>
								<SelectItem value="production">
									Production (Higher Quality)
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<label className="text-right">FPS</label>
						<div className="col-span-3 space-y-2">
							<Slider
								value={[fps]}
								min={1}
								max={60}
								step={1}
								onValueChange={([value]) => setFps(value ?? fps)}
							/>
							<div className="text-xs text-muted-foreground">
								{fps} frames per second
							</div>
						</div>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<label className="text-right">Resolution</label>
						<div className="col-span-3 grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Slider
									value={[width]}
									min={480}
									max={3840}
									step={1}
									onValueChange={([value]) => setWidth(value ?? width)}
								/>
								<div className="text-xs text-muted-foreground">
									Width: {width}px
								</div>
							</div>
							<div className="space-y-2">
								<Slider
									value={[height]}
									min={360}
									max={2160}
									step={1}
									onValueChange={([value]) => setHeight(value ?? height)}
								/>
								<div className="text-xs text-muted-foreground">
									Height: {height}px
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<label className="text-right">Frame Range</label>
						<div className="col-span-3 space-y-2">
							<div className="flex items-center gap-4">
								<div className="space-y-2">
									<Slider
										value={[startFrame]}
										min={0}
										max={endFrame - 1}
										step={1}
										onValueChange={([value]) => setStartFrame(value ?? startFrame)}
									/>
									<div className="text-xs text-muted-foreground">
										Start: {startFrame}
									</div>
								</div>
								<div className="space-y-2">
									<Slider
										value={[endFrame]}
										min={startFrame + 1}
										max={animation.duration * animation.fps}
										step={1}
										onValueChange={([value]) => setEndFrame(value ?? endFrame)}
									/>
									<div className="text-xs text-muted-foreground">
										End: {endFrame}
									</div>
								</div>
							</div>
							<div className="text-xs text-muted-foreground">
								Duration: {((endFrame - startFrame) / fps).toFixed(2)}s
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={isExporting}
					>
						Cancel
					</Button>
					<Button onClick={() => void handleExport()} disabled={isExporting}>
						{isExporting ? "Exporting..." : "Export"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
