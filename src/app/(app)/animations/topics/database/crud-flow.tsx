"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	CREATE: [31, 90], // Create operation
	READ: [91, 150], // Read operation
	UPDATE: [151, 210], // Update operation
	DELETE: [211, 270], // Delete operation
} as const;

interface DataNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	color: string;
}

interface Record {
	id: string;
	name: string;
	email: string;
}

const sampleRecords: Record[] = [
	{ id: "1", name: "John Doe", email: "john@example.com" },
	{ id: "2", name: "Jane Smith", email: "jane@example.com" },
	{ id: "3", name: "Bob Wilson", email: "bob@example.com" },
];

export const CrudFlow = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate center position
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate progress for each stage
	const recordsProgress = interpolate(frame, STAGES.READ, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const operationProgress = interpolate(
		frame,
		[
			STAGES.CREATE[0],
			STAGES.CREATE[1],
			STAGES.UPDATE[0],
			STAGES.UPDATE[1],
			STAGES.DELETE[0],
			STAGES.DELETE[1],
		],
		[0, 1, 0, 1, 0, 1],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		},
	);

	const successProgress = interpolate(
		frame,
		[
			STAGES.CREATE[1] - 30,
			STAGES.CREATE[1],
			STAGES.UPDATE[1] - 30,
			STAGES.UPDATE[1],
			STAGES.DELETE[1] - 30,
			STAGES.DELETE[1],
		],
		[0, 1, 0, 1, 0, 1],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		},
	);

	const currentOperation = (() => {
		if (frame >= STAGES.CREATE[0] && frame <= STAGES.CREATE[1]) {
			return "Creating Record";
		}
		if (frame >= STAGES.UPDATE[0] && frame <= STAGES.UPDATE[1]) {
			return "Updating Record";
		}
		if (frame >= STAGES.DELETE[0] && frame <= STAGES.DELETE[1]) {
			return "Deleting Record";
		}
		return "";
	})();

	// Database node position
	const database: DataNode = {
		x: centerX,
		y: centerY + 100,
		scale: 1,
		opacity: 1,
		color: "#3b82f6", // blue-500
	};

	// Data node for create operation
	const createNode: DataNode = {
		x: interpolate(createProgress, [0, 1], [centerX - 200, database.x]),
		y: interpolate(createProgress, [0, 1], [centerY - 100, database.y]),
		scale: interpolate(createProgress, [0, 0.8, 1], [0, 1, 0.8]),
		opacity: interpolate(createProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
		color: "#22c55e", // green-500
	};

	// Data node for read operation
	const readNode: DataNode = {
		x: interpolate(readProgress, [0, 1], [database.x, centerX + 200]),
		y: interpolate(readProgress, [0, 1], [database.y, centerY - 100]),
		scale: interpolate(readProgress, [0, 0.2, 1], [0.8, 1, 1]),
		opacity: interpolate(readProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
		color: "#eab308", // yellow-500
	};

	// Data node for update operation
	const updateNode: DataNode = {
		x: interpolate(
			updateProgress,
			[0, 0.5, 1],
			[centerX + 200, database.x, database.x],
		),
		y: interpolate(
			updateProgress,
			[0, 0.5, 1],
			[centerY + 100, database.y, database.y],
		),
		scale: interpolate(updateProgress, [0, 0.4, 0.6, 1], [1, 0.8, 1.2, 0.8]),
		opacity: interpolate(updateProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
		color: "#f97316", // orange-500
	};

	// Data node for delete operation
	const deleteNode: DataNode = {
		x: database.x,
		y: database.y,
		scale: interpolate(deleteProgress, [0, 0.5, 1], [0.8, 1.2, 0]),
		opacity: interpolate(deleteProgress, [0, 0.1, 0.5, 1], [1, 1, 0.5, 0]),
		color: "#ef4444", // red-500
	};

	const renderNode = (node: DataNode, label: string) => (
		<div
			className="absolute flex items-center justify-center"
			style={{
				left: node.x,
				top: node.y,
				transform: `translate(-50%, -50%) scale(${node.scale})`,
				opacity: node.opacity,
			}}
		>
			<div
				className="h-16 w-16 rounded-lg p-2 font-mono text-white shadow-lg transition-all"
				style={{ backgroundColor: node.color }}
			>
				{label}
			</div>
		</div>
	);

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			<div className="absolute inset-0 flex items-center justify-center bg-background">
				<div className="relative w-[80%] min-w-[1000px] max-w-[1600px] rounded-2xl border-2 bg-card p-16 shadow-xl">
					<div className="space-y-12">
						<h2 className="text-6xl font-bold text-foreground">
							Database Operations
						</h2>

						{/* Records Table */}
						<div className="space-y-8">
							<div className="text-3xl text-muted-foreground">Records</div>
							<table className="w-full">
								<thead>
									<tr className="border-b-2 text-2xl">
										<th className="pb-6 text-left">ID</th>
										<th className="pb-6 text-left">Name</th>
										<th className="pb-6 text-left">Email</th>
										<th className="pb-6 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="text-xl">
									{sampleRecords.map((record, i) => (
										<tr
											key={record.id}
											className="border-b"
											style={{
												opacity: interpolate(
													recordsProgress,
													[i * 0.2, i * 0.2 + 0.2],
													[0, 1],
													{
														extrapolateLeft: "clamp",
														extrapolateRight: "clamp",
													},
												),
											}}
										>
											<td className="py-6">{record.id}</td>
											<td className="py-6">{record.name}</td>
											<td className="py-6">{record.email}</td>
											<td className="space-x-4 py-6 text-right">
												<button className="text-blue-500 hover:text-blue-600">
													Edit
												</button>
												<button className="text-red-500 hover:text-red-600">
													Delete
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Operation Indicator */}
						{operationProgress > 0 && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
								style={{ opacity: operationProgress }}
							>
								<div className="space-y-8 text-center">
									<div className="h-16 w-16 animate-spin rounded-full border-8 border-primary border-t-transparent" />
									<div className="text-4xl font-semibold text-primary">
										{currentOperation}
									</div>
									<div className="text-2xl text-muted-foreground">
										Processing database operation...
									</div>
								</div>
							</div>
						)}

						{/* Success Indicator */}
						{successProgress > 0 && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
								style={{ opacity: successProgress }}
							>
								<div className="space-y-4 text-center">
									<div className="text-7xl text-green-500">✓</div>
									<div className="text-4xl font-semibold text-primary">
										Operation Complete
									</div>
									<div className="text-2xl text-muted-foreground">
										Database updated successfully
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

export const crudFlowMetadata: AnimationMetadata = {
	id: "crud-flow",
	title: "CRUD Operations Flow",
	description: "Visualization of Create, Read, Update, Delete operations",
	category: "database",
	duration: 9,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};
