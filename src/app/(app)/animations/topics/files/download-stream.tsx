"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	DOWNLOAD: [31, 120], // Regular download
	BUFFER: [121, 180], // Streaming buffer
	STREAM: [181, 270], // Streaming playback
} as const;

interface FileNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	progress: number;
}

interface BufferNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	filled: number;
}

interface StreamNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	progress: number;
}

export const DownloadStreamFlow = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate center position
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate progress for each stage
	const downloadProgress = interpolate(frame, STAGES.DOWNLOAD, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const bufferProgress = interpolate(frame, STAGES.BUFFER, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const streamProgress = interpolate(frame, STAGES.STREAM, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Download file node
	const downloadFile: FileNode = {
		x: centerX - 200,
		y: centerY - 100,
		scale: interpolate(downloadProgress, [0, 0.2], [0, 1], {
			extrapolateRight: "clamp",
		}),
		opacity: interpolate(downloadProgress, [0.8, 1], [1, 0], {
			extrapolateLeft: "clamp",
		}),
		progress: interpolate(downloadProgress, [0.2, 0.8], [0, 100], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	};

	// Streaming buffer nodes
	const numBuffers = 5;
	const buffers: BufferNode[] = Array.from({ length: numBuffers }, (_, i) => {
		const bufferDelay = i * 0.2;
		return {
			x: centerX - 200 + i * 100,
			y: centerY + 100,
			scale: interpolate(
				bufferProgress,
				[bufferDelay, bufferDelay + 0.2],
				[0, 1],
				{ extrapolateRight: "clamp" },
			),
			opacity: interpolate(streamProgress, [0.8, 1], [1, 0], {
				extrapolateLeft: "clamp",
			}),
			filled: interpolate(
				bufferProgress,
				[bufferDelay, bufferDelay + 0.5],
				[0, 100],
				{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
			),
		};
	});

	// Streaming playback node
	const streamNode: StreamNode = {
		x: centerX,
		y: centerY + 100,
		scale: interpolate(streamProgress, [0, 0.2], [0, 1], {
			extrapolateRight: "clamp",
		}),
		opacity: 1,
		progress: interpolate(streamProgress, [0.2, 0.8], [0, 100], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	};

	const renderDownload = (file: FileNode) => (
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
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="h-12 w-12 rounded-full bg-blue-500/20">
							<svg
								className="h-12 w-12 p-3 text-blue-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
						</div>
						<div className="text-lg font-medium">Downloading</div>
					</div>
					<div className="text-lg text-muted-foreground">
						{Math.round(file.progress)}%
					</div>
				</div>
				<div className="h-3 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full bg-blue-500 transition-all"
						style={{ width: `${file.progress}%` }}
					/>
				</div>
			</div>
		</div>
	);

	const renderBuffer = (buffer: BufferNode) => (
		<div
			className="absolute"
			style={{
				left: buffer.x,
				top: buffer.y,
				transform: `translate(-50%, -50%) scale(${buffer.scale})`,
				opacity: buffer.opacity,
			}}
		>
			<div className="w-48 space-y-3 rounded-lg border bg-card p-4 shadow-lg">
				<div className="text-center text-lg font-medium">
					Buffer {buffer.index}
				</div>
				<div className="h-3 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full bg-yellow-500 transition-all"
						style={{ width: `${buffer.filled}%` }}
					/>
				</div>
				<div className="text-center text-base text-muted-foreground">
					{Math.round(buffer.filled)}%
				</div>
			</div>
		</div>
	);

	const renderStream = (stream: StreamNode) => (
		<div
			className="absolute"
			style={{
				left: stream.x,
				top: stream.y,
				transform: `translate(-50%, -50%) scale(${stream.scale})`,
				opacity: stream.opacity,
			}}
		>
			<div className="w-64 space-y-4 rounded-lg border bg-card p-6 shadow-lg">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="h-12 w-12 rounded-full bg-purple-500/20">
							<svg
								className="h-12 w-12 p-3 text-purple-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div className="text-lg font-medium">Streaming</div>
					</div>
					<div className="text-lg text-muted-foreground">
						{Math.round(stream.progress)}%
					</div>
				</div>
				<div className="h-3 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full bg-purple-500 transition-all"
						style={{ width: `${stream.progress}%` }}
					/>
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
					left: centerX + 200,
					top: centerY,
					transform: "translate(-50%, -50%)",
				}}
			>
				<div className="h-32 w-32 rounded-lg border-2 border-primary bg-card p-4 shadow-lg">
					<div className="mb-2 h-2 w-full rounded bg-muted" />
					<div className="mb-2 h-2 w-3/4 rounded bg-muted" />
					<div className="h-2 w-1/2 rounded bg-muted" />
				</div>
				<span className="text-sm text-muted-foreground">Server</span>
			</div>

			{/* Download */}
			{renderDownload(downloadFile)}

			{/* Buffers */}
			{buffers.map((buffer, i) => (
				<div key={i}>{renderBuffer(buffer)}</div>
			))}

			{/* Stream */}
			{streamProgress > 0 && renderStream(streamNode)}

			{/* Legend */}
			<div className="absolute left-8 top-8 space-y-6 rounded-lg bg-card/50 p-6 backdrop-blur">
				<div>
					<h3 className="mb-4 text-2xl font-semibold">Download & Stream</h3>
					<div className="space-y-3">
						<div
							className="flex items-center gap-3"
							style={{
								opacity: downloadProgress > 0 ? 1 : 0.5,
							}}
						>
							<div className="h-4 w-4 rounded-full bg-blue-500" />
							<span className="text-lg">Download File</span>
						</div>
						<div
							className="flex items-center gap-3"
							style={{
								opacity: bufferProgress > 0 ? 1 : 0.5,
							}}
						>
							<div className="h-4 w-4 rounded-full bg-yellow-500" />
							<span className="text-lg">Buffer Content</span>
						</div>
						<div
							className="flex items-center gap-3"
							style={{
								opacity: streamProgress > 0 ? 1 : 0.5,
							}}
						>
							<div className="h-4 w-4 rounded-full bg-purple-500" />
							<span className="text-lg">Stream Playback</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export const downloadStreamFlowMetadata: AnimationMetadata = {
	id: "download-stream-flow",
	title: "Download & Streaming Flow",
	description: "Visualization of file download and streaming processes",
	category: "files",
	duration: 9,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};
