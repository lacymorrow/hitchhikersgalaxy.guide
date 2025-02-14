"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	QUERY: [31, 120], // GraphQL query
	MUTATION: [121, 210], // GraphQL mutation
} as const;

interface RequestNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	type: "query" | "mutation";
	operation: string;
}

interface ResponseNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	data: string;
}

const operationColors = {
	query: "#3b82f6", // blue-500
	mutation: "#8b5cf6", // violet-500
} as const;

export const GraphqlFlow = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate center position
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate progress for each stage
	const queryProgress = interpolate(frame, STAGES.QUERY, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const mutationProgress = interpolate(frame, STAGES.MUTATION, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Define request nodes
	const requests: RequestNode[] = [
		{
			x: interpolate(queryProgress, [0, 0.5], [centerX - 300, centerX]),
			y: centerY - 100,
			scale: interpolate(queryProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
			opacity: interpolate(queryProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
			type: "query",
			operation: `query GetUser {
  user(id: 1) {
    id
    name
    posts {
      id
      title
    }
  }
}`,
		},
		{
			x: interpolate(mutationProgress, [0, 0.5], [centerX - 300, centerX]),
			y: centerY + 100,
			scale: interpolate(mutationProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
			opacity: interpolate(mutationProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
			type: "mutation",
			operation: `mutation UpdateUser {
  updateUser(id: 1, input: {
    name: "Jane"
  }) {
    id
    name
  }
}`,
		},
	];

	// Define response nodes
	const responses: ResponseNode[] = [
		{
			x: interpolate(queryProgress, [0.5, 1], [centerX, centerX + 300]),
			y: centerY - 100,
			scale: interpolate(queryProgress, [0.5, 0.7, 0.9, 1], [0, 1, 1, 0]),
			opacity: interpolate(queryProgress, [0.5, 0.7, 0.9, 1], [0, 1, 1, 0]),
			data: `{
  "data": {
    "user": {
      "id": 1,
      "name": "John",
      "posts": [
        {
          "id": 1,
          "title": "Hello"
        }
      ]
    }
  }
}`,
		},
		{
			x: interpolate(mutationProgress, [0.5, 1], [centerX, centerX + 300]),
			y: centerY + 100,
			scale: interpolate(mutationProgress, [0.5, 0.7, 0.9, 1], [0, 1, 1, 0]),
			opacity: interpolate(mutationProgress, [0.5, 0.7, 0.9, 1], [0, 1, 1, 0]),
			data: `{
  "data": {
    "updateUser": {
      "id": 1,
      "name": "Jane"
    }
  }
}`,
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
			<div className="space-y-2">
				<div
					className="rounded px-4 py-2 text-lg font-semibold text-white"
					style={{ backgroundColor: operationColors[req.type] }}
				>
					{req.type.toUpperCase()}
				</div>
				<div className="max-w-[500px] overflow-hidden rounded border bg-card/50 px-4 py-3 font-mono text-lg">
					<pre className="whitespace-pre-wrap">{req.operation}</pre>
				</div>
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
			<div className="space-y-2">
				<div className="rounded bg-green-500 px-4 py-2 text-lg font-semibold text-white">
					200 OK
				</div>
				<div className="max-w-[500px] overflow-hidden rounded border bg-card/50 px-4 py-3 font-mono text-lg">
					<pre className="whitespace-pre-wrap">{res.data}</pre>
				</div>
			</div>
		</div>
	);

	return (
		<div className="relative h-full w-full bg-background">
			{/* GraphQL Server */}
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
				<span className="text-lg text-muted-foreground">GraphQL Server</span>
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
					<h3 className="mb-4 text-2xl font-semibold">Operations</h3>
					<div className="space-y-3">
						{Object.entries(operationColors).map(([type, color]) => (
							<div key={type} className="flex items-center gap-3">
								<div
									className="h-4 w-4 rounded-full"
									style={{ backgroundColor: color }}
								/>
								<span className="text-lg">{type.toUpperCase()}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export const graphqlFlowMetadata: AnimationMetadata = {
	id: "graphql-flow",
	title: "GraphQL API Flow",
	description: "Visualization of GraphQL queries and mutations",
	category: "api",
	duration: 7,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};
