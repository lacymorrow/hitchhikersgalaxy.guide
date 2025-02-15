"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	TABLE_SCAN: [31, 90], // Full table scan
	CREATE_INDEX: [91, 150], // Creating the index
	INDEX_SEARCH: [151, 210], // Using the index
} as const;

interface DataRow {
	id: number;
	name: string;
	email: string;
}

interface IndexNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	value: string | number;
	pointer?: number;
}

const SAMPLE_DATA: DataRow[] = [
	{ id: 1, name: "Alice", email: "alice@example.com" },
	{ id: 4, name: "Bob", email: "bob@example.com" },
	{ id: 2, name: "Charlie", email: "charlie@example.com" },
	{ id: 5, name: "David", email: "david@example.com" },
	{ id: 3, name: "Eve", email: "eve@example.com" },
];

export const DatabaseIndexing = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate center position
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate progress for each stage
	const tableScanProgress = interpolate(frame, STAGES.TABLE_SCAN, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const createIndexProgress = interpolate(frame, STAGES.CREATE_INDEX, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const indexSearchProgress = interpolate(frame, STAGES.INDEX_SEARCH, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Create index nodes
	const indexNodes: IndexNode[] = SAMPLE_DATA.map((row, i) => ({
		x: centerX + 200,
		y: centerY - 100 + i * 50,
		scale: interpolate(createIndexProgress, [i * 0.2, i * 0.2 + 0.2], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
		opacity: interpolate(
			createIndexProgress,
			[i * 0.2, i * 0.2 + 0.2],
			[0, 1],
			{
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp",
			},
		),
		value: row.id,
		pointer: i,
	}));

	// Highlight effect for table scan
	const scanHighlight = Math.floor(
		interpolate(tableScanProgress, [0, 1], [0, SAMPLE_DATA.length], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	);

	// Highlight effect for index search
	const searchHighlight = Math.floor(
		interpolate(indexSearchProgress, [0, 1], [0, indexNodes.length], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	);

	const renderTable = () => (
		<div
			className="absolute"
			style={{
				left: centerX - 200,
				top: centerY - 150,
			}}
		>
			<div className="w-96 overflow-hidden rounded-lg border bg-card shadow-lg">
				<div className="border-b bg-muted/50 p-2 text-center font-semibold">
					Users Table
				</div>
				<div className="divide-y">
					{SAMPLE_DATA.map((row, i) => (
						<div
							key={row.id}
							className="flex items-center gap-4 p-2 transition-colors"
							style={{
								backgroundColor:
									i === scanHighlight ? "rgba(var(--primary), 0.1)" : undefined,
							}}
						>
							<div className="w-12 text-sm text-muted-foreground">{row.id}</div>
							<div className="w-24 text-sm">{row.name}</div>
							<div className="text-sm text-muted-foreground">{row.email}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);

	const renderIndex = () => (
		<div className="absolute right-8 top-8 space-y-2">
			<div className="rounded-lg border bg-card p-2 text-center font-semibold shadow-lg">
				Index (ID)
			</div>
			<div className="space-y-2">
				{indexNodes.map((node, i) => (
					<div
						key={i}
						className="flex items-center gap-4"
						style={{
							transform: `scale(${node.scale})`,
							opacity: node.opacity,
						}}
					>
						<div
							className="w-16 rounded border bg-card p-1 text-center text-sm transition-colors"
							style={{
								backgroundColor:
									i === searchHighlight
										? "rgba(var(--primary), 0.1)"
										: undefined,
							}}
						>
							{node.value}
						</div>
						<div className="flex h-8 items-center">
							<div className="h-0.5 w-8 bg-primary" />
							<div className="h-4 w-4 rounded-full border-2 border-primary text-center text-xs leading-3">
								{node.pointer}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			<div className="absolute inset-0 flex items-center justify-center bg-background">
				<div className="relative w-[80%] min-w-[1000px] max-w-[1600px] rounded-2xl border-2 bg-card p-16 shadow-xl">
					<div className="space-y-12">
						<h2 className="text-6xl font-bold text-foreground">
							Database Indexing
						</h2>

						{/* Data Table */}
						<div className="space-y-8">
							<div className="text-3xl text-muted-foreground">Records</div>
							<table className="w-full">
								<thead>
									<tr className="border-b-2 text-2xl">
										<th className="pb-6 text-left">ID</th>
										<th className="pb-6 text-left">Name</th>
										<th className="pb-6 text-left">Email</th>
										<th className="pb-6 text-right">Search Time</th>
									</tr>
								</thead>
								<tbody className="text-xl">
									{SAMPLE_DATA.map((row, i) => (
										<tr
											key={row.id}
											className={`border-b ${
												indexSearchProgress > 0 && i === searchHighlight
													? "bg-primary/10"
													: ""
											}`}
											style={{
												opacity: interpolate(
													indexSearchProgress,
													[i * 0.1, i * 0.1 + 0.1],
													[0, 1],
													{
														extrapolateLeft: "clamp",
														extrapolateRight: "clamp",
													},
												),
											}}
										>
											<td className="py-6">{row.id}</td>
											<td className="py-6">{row.name}</td>
											<td className="py-6">{row.email}</td>
											<td className="py-6 text-right">
												{indexSearchProgress > 0 && i === searchHighlight
													? "0.001ms"
													: "10ms"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Index Structure */}
						{createIndexProgress > 0 && (
							<div className="space-y-8">
								<div className="text-3xl text-muted-foreground">
									Index (B-Tree)
								</div>
								<div className="flex justify-center">
									<div className="space-y-8">
										<div className="flex justify-center">
											<div className="rounded-xl border-2 bg-card p-8 text-2xl">
												Root Node
											</div>
										</div>
										<div className="flex justify-center gap-16">
											{[1, 2, 3].map((i) => (
												<div
													key={i}
													className="rounded-xl border-2 bg-card p-8 text-2xl"
												>
													Branch {i}
												</div>
											))}
										</div>
										<div className="flex justify-center gap-8">
											{[1, 2, 3, 4, 5].map((i) => (
												<div
													key={i}
													className="rounded-xl border-2 bg-card p-8 text-2xl"
												>
													Leaf {i}
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Search Progress */}
						{indexSearchProgress > 0 && (
							<div className="space-y-8">
								<div className="text-3xl text-muted-foreground">
									Search Progress
								</div>
								<div className="flex items-center justify-center gap-8">
									<div className="h-16 w-16 animate-spin rounded-full border-8 border-primary border-t-transparent" />
									<div className="text-4xl font-semibold text-primary">
										Searching with Index...
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export const databaseIndexingMetadata: AnimationMetadata = {
	id: "database-indexing",
	title: "Database Indexing",
	description: "Visualization of database indexing and its benefits",
	category: "database",
	duration: 7,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};
