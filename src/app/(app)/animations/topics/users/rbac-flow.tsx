"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	USER_ROLES: [31, 90], // Show user roles
	PERMISSIONS: [91, 150], // Show permissions
	ACCESS_CHECK: [151, 210], // Access check flow
	DENIED: [211, 240], // Access denied
	GRANTED: [241, 270], // Access granted
} as const;

interface RoleNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	role: string;
	color: string;
}

interface PermissionNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	permission: string;
	color: string;
}

const roles: RoleNode[] = [
	{
		role: "Admin",
		color: "#ef4444", // red-500
		x: 0,
		y: 0,
		scale: 0,
		opacity: 0,
	},
	{
		role: "Editor",
		color: "#f59e0b", // amber-500
		x: 0,
		y: 0,
		scale: 0,
		opacity: 0,
	},
	{
		role: "Viewer",
		color: "#22c55e", // green-500
		x: 0,
		y: 0,
		scale: 0,
		opacity: 0,
	},
];

const permissions: PermissionNode[] = [
	{
		permission: "Create",
		color: "#3b82f6", // blue-500
		x: 0,
		y: 0,
		scale: 0,
		opacity: 0,
	},
	{
		permission: "Read",
		color: "#8b5cf6", // violet-500
		x: 0,
		y: 0,
		scale: 0,
		opacity: 0,
	},
	{
		permission: "Update",
		color: "#ec4899", // pink-500
		x: 0,
		y: 0,
		scale: 0,
		opacity: 0,
	},
	{
		permission: "Delete",
		color: "#f43f5e", // rose-500
		x: 0,
		y: 0,
		scale: 0,
		opacity: 0,
	},
];

export const RbacFlow = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate center position
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate progress for each stage
	const rolesProgress = interpolate(frame, STAGES.USER_ROLES, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const permissionsProgress = interpolate(frame, STAGES.PERMISSIONS, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const accessCheckProgress = interpolate(frame, STAGES.ACCESS_CHECK, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const deniedProgress = interpolate(frame, STAGES.DENIED, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const grantedProgress = interpolate(frame, STAGES.GRANTED, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Update node positions
	const updatedRoles = roles.map((role, i) => ({
		...role,
		x: centerX - 300,
		y: centerY - 100 + i * 100,
		scale: interpolate(rolesProgress, [i * 0.2, i * 0.2 + 0.2], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
		opacity: interpolate(rolesProgress, [i * 0.2, i * 0.2 + 0.2], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	}));

	const updatedPermissions = permissions.map((permission, i) => ({
		...permission,
		x: centerX + 300,
		y: centerY - 150 + i * 100,
		scale: interpolate(permissionsProgress, [i * 0.2, i * 0.2 + 0.2], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
		opacity: interpolate(
			permissionsProgress,
			[i * 0.2, i * 0.2 + 0.2],
			[0, 1],
			{
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp",
			},
		),
	}));

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			<div className="absolute inset-0 flex items-center justify-center bg-background">
				<div className="relative w-[32rem] rounded-lg border bg-card p-6 shadow-lg">
					{/* RBAC Content */}
					{/* Roles */}
					{updatedRoles.map((role, i) => (
						<div
							key={role.role}
							className="absolute flex items-center gap-4"
							style={{
								left: role.x,
								top: role.y,
								transform: `translate(-50%, -50%) scale(${role.scale})`,
								opacity: role.opacity,
							}}
						>
							<div
								className="rounded-lg px-4 py-2 font-medium text-white shadow-lg"
								style={{ backgroundColor: role.color }}
							>
								{role.role}
							</div>
							<div
								className="h-0.5 w-[200px]"
								style={{
									backgroundColor: role.color,
									opacity: accessCheckProgress,
								}}
							/>
						</div>
					))}

					{/* Permissions */}
					{updatedPermissions.map((permission, i) => (
						<div
							key={permission.permission}
							className="absolute"
							style={{
								left: permission.x,
								top: permission.y,
								transform: `translate(-50%, -50%) scale(${permission.scale})`,
								opacity: permission.opacity,
							}}
						>
							<div
								className="rounded-lg px-4 py-2 font-medium text-white shadow-lg"
								style={{ backgroundColor: permission.color }}
							>
								{permission.permission}
							</div>
						</div>
					))}

					{/* Access Check Results */}
					<div
						className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
						style={{
							opacity: accessCheckProgress,
						}}
					>
						<div className="space-y-4 rounded-lg border bg-card p-6 shadow-lg">
							<h3 className="text-lg font-semibold">Access Check</h3>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-green-500" />
									<span className="text-sm">Admin → All Permissions</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-yellow-500" />
									<span className="text-sm">Editor → Create, Read, Update</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-red-500" />
									<span className="text-sm">Viewer → Read only</span>
								</div>
							</div>
						</div>
					</div>

					{/* Access Denied */}
					{deniedProgress > 0 && (
						<div
							className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
							style={{ opacity: deniedProgress }}
						>
							<div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
								<div className="text-lg font-semibold">Access Denied</div>
								<div className="text-sm">Insufficient permissions</div>
							</div>
						</div>
					)}

					{/* Access Granted */}
					{grantedProgress > 0 && (
						<div
							className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
							style={{ opacity: grantedProgress }}
						>
							<div className="rounded-lg border border-green-500 bg-green-500/10 p-4 text-green-500">
								<div className="text-lg font-semibold">Access Granted</div>
								<div className="text-sm">Permission verified</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export const rbacFlowMetadata: AnimationMetadata = {
	id: "rbac-flow",
	title: "Role-Based Access Control",
	description: "Visualization of RBAC system and permission management",
	category: "users",
	duration: 9,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};
