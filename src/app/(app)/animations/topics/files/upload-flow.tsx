"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	SELECT: [31, 60], // File selection
	CHUNK: [61, 120], // File chunking
	UPLOAD: [121, 210], // Chunk upload
	COMPLETE: [211, 270], // Upload complete
} as const;

interface FileNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	name: string;
	size: string;
	type: string;
}

interface ChunkNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	index: number;
	progress: number;
}

export const FileUploadFlow = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate center position
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate progress for each stage
	const selectProgress = interpolate(frame, STAGES.SELECT, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const chunkProgress = interpolate(frame, STAGES.CHUNK, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const uploadProgress = interpolate(frame, STAGES.UPLOAD, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const completeProgress = interpolate(frame, STAGES.COMPLETE, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// File node
	const file: FileNode = {
		x: interpolate(selectProgress, [0, 1], [centerX - 300, centerX - 200]),
		y: centerY,
		scale: interpolate(selectProgress, [0, 0.5], [0, 1], {
			extrapolateRight: "clamp",
		}),
		opacity: interpolate(completeProgress, [0, 0.5], [1, 0], {
			extrapolateLeft: "clamp",
		}),
		name: "large-video.mp4",
		size: "1.2 GB",
		type: "video/mp4",
	};

	// Create chunk nodes
	const numChunks = 5;
	const chunks: ChunkNode[] = Array.from({ length: numChunks }, (_, i) => {
		const chunkDelay = i * 0.2;
		const uploadDelay = i * 0.15;

		return {
			x: interpolate(
				chunkProgress,
				[chunkDelay, chunkDelay + 0.3],
				[centerX - 200, centerX + i * 50 - 100],
				{ extrapolateRight: "clamp" },
			),
			y: interpolate(
				uploadProgress,
				[uploadDelay, uploadDelay + 0.5],
				[centerY, centerY - 150],
				{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
			),
			scale: interpolate(
				chunkProgress,
				[chunkDelay, chunkDelay + 0.3],
				[0, 1],
				{ extrapolateRight: "clamp" },
			),
			opacity: interpolate(completeProgress, [0, 0.5], [1, 0], {
				extrapolateLeft: "clamp",
			}),
			index: i + 1,
			progress: interpolate(
				uploadProgress,
				[uploadDelay, uploadDelay + 0.5],
				[0, 100],
				{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
			),
		};
	});

	const renderFile = (file: FileNode) => (
		<div
			className="absolute"
			style={{
				left: file.x,
				top: file.y,
				transform: `translate(-50%, -50%) scale(${file.scale})`,
				opacity: file.opacity,
			}}
		>
			<div className="w-64 space-y-4 rounded-lg border bg-card p-6 shadow-lg">
				<div className="flex items-center gap-4">
					<div className="h-12 w-12 rounded-full bg-primary/20">
						<svg
							className="h-12 w-12 p-3 text-primary"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<div className="flex-1 truncate">
						<div className="truncate text-lg font-medium">{file.name}</div>
						<div className="text-base text-muted-foreground">{file.size}</div>
					</div>
				</div>
			</div>
		</div>
	);

	const renderChunk = (chunk: ChunkNode) => (
		<div
			className="absolute"
			style={{
				left: chunk.x,
				top: chunk.y,
				transform: `translate(-50%, -50%) scale(${chunk.scale})`,
				opacity: chunk.opacity,
			}}
		>
			<div className="w-48 space-y-3 rounded-lg border bg-card p-4 shadow-lg">
				<div className="text-center text-lg font-medium">
					Chunk {chunk.index}
				</div>
				<div className="h-3 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full bg-primary transition-all"
						style={{ width: `${chunk.progress}%` }}
					/>
				</div>
				<div className="text-center text-base text-muted-foreground">
					{Math.round(chunk.progress)}%
				</div>
			</div>
		</div>
	);

	return (
		<div className="relative h-full w-full bg-background">
			{/* Server */}
			<div
				className="absolute flex flex-col items-center gap-2"
				style={{
					left: centerX,
					top: centerY - 150,
					transform: "translate(-50%, -50%)",
				}}
			>
				<div className="h-48 w-48 rounded-lg border-2 border-primary bg-card p-6 shadow-lg">
					<div className="mb-4 h-3 w-full rounded bg-muted" />
					<div className="mb-4 h-3 w-3/4 rounded bg-muted" />
					<div className="h-3 w-1/2 rounded bg-muted" />
				</div>
				<span className="text-lg text-muted-foreground">Server</span>
			</div>

			{/* File */}
			{renderFile(file)}

			{/* Chunks */}
			{chunks.map((chunk, i) => (
				<div key={i}>{renderChunk(chunk)}</div>
			))}

			{/* Upload Complete */}
			<div
				className="absolute flex flex-col items-center gap-2"
				style={{
					left: centerX,
					top: centerY - 150,
					transform: "translate(-50%, -50%)",
					opacity: completeProgress,
				}}
			>
				<div className="rounded-full bg-green-500/20 p-6">
					<svg
						className="h-12 w-12 text-green-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
				<span className="text-2xl font-medium text-green-500">
					Upload Complete
				</span>
			</div>

			{/* Progress Steps */}
			<div className="absolute left-8 top-8 space-y-6 rounded-lg bg-card/50 p-6 backdrop-blur">
				<div>
					<h3 className="mb-4 text-2xl font-semibold">Upload Process</h3>
					<div className="space-y-3">
						<div
							className="flex items-center gap-3"
							style={{
								opacity: selectProgress > 0 ? 1 : 0.5,
							}}
						>
							<div className="h-4 w-4 rounded-full bg-blue-500" />
							<span className="text-lg">Select File</span>
						</div>
						<div
							className="flex items-center gap-3"
							style={{
								opacity: chunkProgress > 0 ? 1 : 0.5,
							}}
						>
							<div className="h-4 w-4 rounded-full bg-yellow-500" />
							<span className="text-lg">Split into Chunks</span>
						</div>
						<div
							className="flex items-center gap-3"
							style={{
								opacity: uploadProgress > 0 ? 1 : 0.5,
							}}
						>
							<div className="h-4 w-4 rounded-full bg-purple-500" />
							<span className="text-lg">Upload Chunks</span>
						</div>
						<div
							className="flex items-center gap-3"
							style={{
								opacity: completeProgress > 0 ? 1 : 0.5,
							}}
						>
							<div className="h-4 w-4 rounded-full bg-green-500" />
							<span className="text-lg">Complete</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export const fileUploadFlowMetadata: AnimationMetadata = {
	id: "file-upload-flow",
	title: "File Upload Flow",
	description: "Visualization of chunked file upload process",
	category: "files",
	duration: 9,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};
