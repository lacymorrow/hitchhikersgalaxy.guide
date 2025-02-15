"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	GET: [31, 90], // GET request
	POST: [91, 150], // POST request
	PUT: [151, 210], // PUT request
	DELETE: [211, 270], // DELETE request
} as const;

interface RequestNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	method: "GET" | "POST" | "PUT" | "DELETE";
	path: string;
	data?: string;
}

interface ResponseNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	status: number;
	data: string;
}

const methodColors = {
	GET: "#22c55e", // green-500
	POST: "#3b82f6", // blue-500
	PUT: "#f59e0b", // amber-500
	DELETE: "#ef4444", // red-500
} as const;

export const RestApiFlow = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate center position
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate progress for each stage
	const getProgress = interpolate(frame, STAGES.GET, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const postProgress = interpolate(frame, STAGES.POST, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const putProgress = interpolate(frame, STAGES.PUT, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const deleteProgress = interpolate(frame, STAGES.DELETE, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Define request nodes
	const requests: RequestNode[] = [
		{
			x: interpolate(getProgress, [0, 0.5], [centerX - 300, centerX]),
			y: centerY - 150,
			scale: interpolate(getProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
			opacity: interpolate(getProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
			method: "GET",
			path: "/api/users/1",
		},
		{
			x: interpolate(postProgress, [0, 0.5], [centerX - 300, centerX]),
			y: centerY - 50,
			scale: interpolate(postProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
			opacity: interpolate(postProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
			method: "POST",
			path: "/api/users",
			data: '{"name": "John"}',
		},
		{
			x: interpolate(putProgress, [0, 0.5], [centerX - 300, centerX]),
			y: centerY + 50,
			scale: interpolate(putProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
			opacity: interpolate(putProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
			method: "PUT",
			path: "/api/users/1",
			data: '{"name": "Jane"}',
		},
		{
			x: interpolate(deleteProgress, [0, 0.5], [centerX - 300, centerX]),
			y: centerY + 150,
			scale: interpolate(deleteProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
			opacity: interpolate(deleteProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
			method: "DELETE",
			path: "/api/users/1",
		},
	];

	// Define response nodes
	const responses: ResponseNode[] = [
		{
			x: interpolate(getProgress, [0.5, 1], [centerX, centerX + 300]),
			y: centerY - 150,
			scale: interpolate(getProgress, [0.5, 0.7, 0.9, 1], [0, 1, 1, 0]),
			opacity: interpolate(getProgress, [0.5, 0.7, 0.9, 1], [0, 1, 1, 0]),
			status: 200,
			data: '{"id": 1, "name": "John"}',
		},
		{
			x: interpolate(postProgress, [0.5, 1], [centerX, centerX + 300]),
			y: centerY - 50,
			scale: interpolate(postProgress, [0.5, 0.7, 0.9, 1], [0, 1, 1, 0]),
			opacity: interpolate(postProgress, [0.5, 0.7, 0.9, 1], [0, 1, 1, 0]),
			status: 201,
			data: '{"id": 2, "name": "John"}',
		},
		{
			x: interpolate(putProgress, [0.5, 1], [centerX, centerX + 300]),
			y: centerY + 50,
			scale: interpolate(putProgress, [0.5, 0.7, 0.9, 1], [0, 1, 1, 0]),
			opacity: interpolate(putProgress, [0.5, 0.7, 0.9, 1], [0, 1, 1, 0]),
			status: 200,
			data: '{"id": 1, "name": "Jane"}',
		},
		{
			x: interpolate(deleteProgress, [0.5, 1], [centerX, centerX + 300]),
			y: centerY + 150,
			scale: interpolate(deleteProgress, [0.5, 0.7, 0.9, 1], [0, 1, 1, 0]),
			opacity: interpolate(deleteProgress, [0.5, 0.7, 0.9, 1], [0, 1, 1, 0]),
			status: 204,
			data: "",
		},
	];

	const renderRequest = (req: RequestNode) => (
		<div
			className="absolute"
			style={{
				left: req.x,
				top: req.y,
				transform: `translate(-50%, -50%) scale(${req.scale})`,
				opacity: req.opacity,
			}}
		>
			<div className="space-y-1">
				<div
					className="rounded px-4 py-2 text-lg font-semibold text-white"
					style={{ backgroundColor: methodColors[req.method] }}
				>
					{req.method}
				</div>
				<div className="rounded border bg-card px-4 py-2 text-lg">
					{req.path}
				</div>
				{req.data && (
					<div className="max-w-[400px] overflow-hidden text-ellipsis rounded border border-dashed bg-muted/20 px-4 py-2 font-mono text-lg">
						{req.data}
					</div>
				)}
			</div>
		</div>
	);

	const renderResponse = (res: ResponseNode) => (
		<div
			className="absolute"
			style={{
				left: res.x,
				top: res.y,
				transform: `translate(-50%, -50%) scale(${res.scale})`,
				opacity: res.opacity,
			}}
		>
			<div className="space-y-1">
				<div
					className={`rounded px-4 py-2 text-lg font-semibold text-white ${
						res.status < 300
							? "bg-green-500"
							: res.status < 400
								? "bg-yellow-500"
								: "bg-red-500"
					}`}
				>
					{res.status}
				</div>
				{res.data && (
					<div className="max-w-[400px] overflow-hidden text-ellipsis rounded border border-dashed bg-muted/20 px-4 py-2 font-mono text-lg">
						{res.data}
					</div>
				)}
			</div>
		</div>
	);

	return (
		<div className="relative h-full w-full bg-background">
			{/* API Server */}
			<div
				className="absolute flex flex-col items-center gap-2"
				style={{
					left: centerX,
					top: centerY,
					transform: "translate(-50%, -50%)",
				}}
			>
				<div className="h-48 w-36 rounded-lg border-2 border-primary bg-card p-4 shadow-lg">
					<div className="mb-3 h-3 w-full rounded bg-muted" />
					<div className="mb-3 h-3 w-3/4 rounded bg-muted" />
					<div className="h-3 w-1/2 rounded bg-muted" />
				</div>
				<span className="text-lg text-muted-foreground">API Server</span>
			</div>

			{/* Requests */}
			{requests.map((req, i) => (
				<div key={`req-${i}`}>{renderRequest(req)}</div>
			))}

			{/* Responses */}
			{responses.map((res, i) => (
				<div key={`res-${i}`}>{renderResponse(res)}</div>
			))}

			{/* Legend */}
			<div className="absolute left-8 top-8 space-y-6 rounded-lg bg-card/50 p-6 backdrop-blur">
				<div>
					<h3 className="mb-4 text-2xl font-semibold">HTTP Methods</h3>
					<div className="space-y-3">
						{Object.entries(methodColors).map(([method, color]) => (
							<div key={method} className="flex items-center gap-3">
								<div
									className="h-4 w-4 rounded-full"
									style={{ backgroundColor: color }}
								/>
								<span className="text-lg">{method}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export const restApiFlowMetadata: AnimationMetadata = {
	id: "rest-api-flow",
	title: "RESTful API Flow",
	description: "Visualization of RESTful API request/response cycle",
	category: "api",
	duration: 9,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};
