"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	ONE_TO_ONE: [31, 90], // One-to-one relationship
	ONE_TO_MANY: [91, 150], // One-to-many relationship
	MANY_TO_MANY: [151, 210], // Many-to-many relationship
} as const;

interface TableNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	label: string;
	fields: string[];
}

interface RelationLine {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	opacity: number;
	style: "one" | "many";
}

interface User {
	id: string;
	name: string;
	email: string;
}

interface Order {
	id: string;
	userId: string;
	product: string;
	price: number;
}

const sampleUsers: User[] = [
	{ id: "1", name: "John Doe", email: "john@example.com" },
	{ id: "2", name: "Jane Smith", email: "jane@example.com" },
	{ id: "3", name: "Bob Wilson", email: "bob@example.com" },
];

const sampleOrders: Order[] = [
	{ id: "1", userId: "1", product: "Product A", price: 99.99 },
	{ id: "2", userId: "1", product: "Product B", price: 149.99 },
	{ id: "3", userId: "2", product: "Product C", price: 199.99 },
];

export const RelationshipsFlow = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate center position
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate progress for each stage
	const usersProgress = interpolate(frame, STAGES.USERS, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const ordersProgress = interpolate(frame, STAGES.ORDERS, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const relationshipProgress = interpolate(frame, STAGES.RELATIONSHIP, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			<div className="absolute inset-0 flex items-center justify-center bg-background">
				<div className="relative w-[80%] min-w-[1000px] max-w-[1600px] rounded-2xl border-2 bg-card p-16 shadow-xl">
					<div className="space-y-12">
						<h2 className="text-6xl font-bold text-foreground">
							Database Relationships
						</h2>

						<div className="grid grid-cols-2 gap-8">
							{/* Users Table */}
							<div className="space-y-8">
								<div className="text-3xl text-muted-foreground">Users</div>
								<table className="w-full">
									<thead>
										<tr className="border-b-2 text-2xl">
											<th className="pb-6 text-left">ID</th>
											<th className="pb-6 text-left">Name</th>
											<th className="pb-6 text-left">Email</th>
										</tr>
									</thead>
									<tbody className="text-xl">
										{sampleUsers.map((user, i) => (
											<tr
												key={user.id}
												className="border-b"
												style={{
													opacity: interpolate(
														usersProgress,
														[i * 0.2, i * 0.2 + 0.2],
														[0, 1],
														{
															extrapolateLeft: "clamp",
															extrapolateRight: "clamp",
														},
													),
												}}
											>
												<td className="py-6">{user.id}</td>
												<td className="py-6">{user.name}</td>
												<td className="py-6">{user.email}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Orders Table */}
							<div className="space-y-8">
								<div className="text-3xl text-muted-foreground">Orders</div>
								<table className="w-full">
									<thead>
										<tr className="border-b-2 text-2xl">
											<th className="pb-6 text-left">ID</th>
											<th className="pb-6 text-left">User ID</th>
											<th className="pb-6 text-left">Product</th>
											<th className="pb-6 text-right">Price</th>
										</tr>
									</thead>
									<tbody className="text-xl">
										{sampleOrders.map((order, i) => (
											<tr
												key={order.id}
												className="border-b"
												style={{
													opacity: interpolate(
														ordersProgress,
														[i * 0.2, i * 0.2 + 0.2],
														[0, 1],
														{
															extrapolateLeft: "clamp",
															extrapolateRight: "clamp",
														},
													),
												}}
											>
												<td className="py-6">{order.id}</td>
												<td className="py-6">{order.userId}</td>
												<td className="py-6">{order.product}</td>
												<td className="py-6 text-right">
													${order.price.toFixed(2)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						{/* Relationship Indicator */}
						{relationshipProgress > 0 && (
							<div className="mt-8 space-y-8">
								<div className="text-3xl text-muted-foreground">
									Relationships
								</div>
								<div className="flex items-center justify-center gap-8">
									<div className="rounded-lg border bg-card p-4">
										<div className="text-xl font-medium">One-to-Many</div>
										<div className="mt-2 text-muted-foreground">
											One user can have multiple orders
										</div>
									</div>
									<div className="text-4xl text-primary">→</div>
									<div className="rounded-lg border bg-card p-4">
										<div className="text-xl font-medium">Foreign Key</div>
										<div className="mt-2 text-muted-foreground">
											Orders reference users via userId
										</div>
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

export const databaseRelationshipsMetadata: AnimationMetadata = {
	id: "database-relationships",
	title: "Database Relationships",
	description: "Visualization of database relationship types",
	category: "database",
	duration: 7,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};
