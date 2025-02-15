"use client";

import { useCurrentPlayerFrame } from "@/app/(app)/animations/hooks/use-current-player-frame";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Player, type PlayerRef } from "@remotion/player";
import {
	Camera,
	Download,
	Pause,
	Play,
	RefreshCw,
	Repeat,
	RotateCcw,
	RotateCw,
	Square,
} from "lucide-react";
import { RefObject, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ExportDialog } from "../components/export-dialog";
import { type AnimationComponent } from "../types";

interface Props {
	animation: AnimationComponent;
}

export const AnimationPreview = ({ animation }: Props) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [speed, setSpeed] = useState(1);
	const [isLooping, setIsLooping] = useState(false);
	const [loopCount, setLoopCount] = useState<number | "infinite">("infinite");
	const [currentLoop, setCurrentLoop] = useState(0);
	const [showExportDialog, setShowExportDialog] = useState(false);
	const playerRef = useRef<PlayerRef>(null);

	const { metadata } = animation;
	const totalFrames = metadata.duration * metadata.fps;

	// Use the custom hook to get the current frame
	const frame = useCurrentPlayerFrame(playerRef as RefObject<PlayerRef>);

	// Keyboard shortcuts
	useHotkeys("space", (event: KeyboardEvent) => {
		event.preventDefault();
		handlePlayPause();
	});

	useHotkeys("left", (event: KeyboardEvent) => {
		event.preventDefault();
		handleStepBackward();
	});

	useHotkeys("right", (event: KeyboardEvent) => {
		event.preventDefault();
		handleStepForward();
	});

	useHotkeys("shift+left", (event: KeyboardEvent) => {
		event.preventDefault();
		handleJumpBackward();
	});

	useHotkeys("shift+right", (event: KeyboardEvent) => {
		event.preventDefault();
		handleJumpForward();
	});

	useEffect(() => {
		setIsPlaying(false);
		setCurrentLoop(0);
	}, []);

	const handlePlayPause = () => {
		if (playerRef.current) {
			if (isPlaying) {
				playerRef.current.pause();
			} else {
				playerRef.current.play();
			}
			setIsPlaying(!isPlaying);
			console.log("Play/Pause - isPlaying:", !isPlaying);
		}
	};

	const handleStop = () => {
		if (playerRef.current) {
			playerRef.current.pause();
			playerRef.current.seekTo(0);
			setIsPlaying(false);
			console.log("Stop - frame:", 0);
		}
	};

	const handleRestart = () => {
		if (playerRef.current) {
			playerRef.current.seekTo(0);
			playerRef.current.play();
			setIsPlaying(true);
			console.log("Restart - frame:", 0);
		}
	};

	const handleStepBackward = () => {
		if (playerRef.current) {
			const newFrame = Math.max(0, frame - 1);
			playerRef.current.seekTo(newFrame);
			console.log("Step Backward - frame:", newFrame);
		}
	};

	const handleStepForward = () => {
		if (playerRef.current) {
			const newFrame = Math.min(totalFrames - 1, frame + 1);
			playerRef.current.seekTo(newFrame);
			console.log("Step Forward - frame:", newFrame);
		}
	};

	const handleSpeedChange = (newSpeed: string) => {
		const speedValue = Number.parseFloat(newSpeed);
		setSpeed(speedValue);
		console.log("Speed Change:", speedValue);
	};

	const handleFrameChange = (value: number[]) => {
		const newFrame = value[0];
		if (typeof newFrame === "number" && playerRef.current) {
			playerRef.current.seekTo(newFrame);
			console.log("Scrubber Change - frame:", newFrame);
		}
	};

	const handleJumpBackward = () => {
		if (playerRef.current) {
			const newFrame = Math.max(0, frame - 10);
			playerRef.current.seekTo(newFrame);
			console.log("Jump Backward - frame:", newFrame);
		}
	};

	const handleJumpForward = () => {
		if (playerRef.current) {
			const newFrame = Math.min(totalFrames - 1, frame + 10);
			playerRef.current.seekTo(newFrame);
			console.log("Jump Forward - frame:", newFrame);
		}
	};

	const handleLoopToggle = () => {
		setIsLooping(!isLooping);
	};

	const handleLoopCountChange = (value: string) => {
		setLoopCount(value === "infinite" ? "infinite" : Number.parseInt(value));
	};

	const handleCaptureFrame = () => {
		if (playerRef.current) {
			// Implementation will be added for frame capture
			console.log("Capture frame:", frame);
		}
	};

	return (
		<Card className="space-y-4 p-4">
			<div className="aspect-video overflow-hidden rounded-lg bg-muted">
				<Player
					ref={playerRef}
					component={animation.Component}
					durationInFrames={totalFrames}
					fps={metadata.fps}
					compositionWidth={metadata.width}
					compositionHeight={metadata.height}
					style={{
						width: "100%",
						height: "100%",
						aspectRatio: `${metadata.width} / ${metadata.height}`,
					}}
					inputProps={{}}
					clickToPlay={false}
					loop={false}
					autoPlay={false}
					controls
					showPosterWhenPaused
					playbackRate={speed}
				/>
			</div>

			<div className="space-y-4">
				{/* Playback Controls */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										onClick={handleStepBackward}
									>
										<RotateCcw className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Previous Frame (←)</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										onClick={handlePlayPause}
									>
										{isPlaying ? (
											<Pause className="h-4 w-4" />
										) : (
											<Play className="h-4 w-4" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{isPlaying ? "Pause" : "Play"} (Space)
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="outline" size="icon" onClick={handleStop}>
										<Square className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Stop</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										onClick={handleStepForward}
									>
										<RotateCw className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Next Frame (→)</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="outline" size="icon" onClick={handleRestart}>
										<RefreshCw className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Restart</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										onClick={handleLoopToggle}
									>
										<Repeat
											className={cn("h-4 w-4", {
												"text-primary": isLooping,
											})}
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Toggle Loop</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										onClick={handleCaptureFrame}
									>
										<Camera className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Capture Frame</TooltipContent>
							</Tooltip>
						</>
					</div>

					<div className="flex items-center gap-4">
						{isLooping && (
							<Select
								value={loopCount.toString()}
								onValueChange={handleLoopCountChange}
							>
								<SelectTrigger className="w-[120px]">
									<SelectValue placeholder="Loop Count" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="infinite">∞</SelectItem>
									<SelectItem value="2">2</SelectItem>
									<SelectItem value="3">3</SelectItem>
									<SelectItem value="5">5</SelectItem>
									<SelectItem value="10">10</SelectItem>
								</SelectContent>
							</Select>
						)}

						<Tooltip>
							<TooltipTrigger asChild>
								<Select
									value={speed.toString()}
									onValueChange={handleSpeedChange}
								>
									<SelectTrigger className="w-[120px]">
										<SelectValue placeholder="Speed" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="0.25">0.25x</SelectItem>
										<SelectItem value="0.5">0.5x</SelectItem>
										<SelectItem value="1">1x</SelectItem>
										<SelectItem value="1.5">1.5x</SelectItem>
										<SelectItem value="2">2x</SelectItem>
									</SelectContent>
								</Select>
							</TooltipTrigger>
							<TooltipContent>Playback Speed</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									onClick={() => setShowExportDialog(true)}
								>
									<Download className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Export Animation</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>

			<ExportDialog
				animation={animation.metadata}
				isOpen={showExportDialog}
				onClose={() => setShowExportDialog(false)}
			/>
		</Card>
	);
};
