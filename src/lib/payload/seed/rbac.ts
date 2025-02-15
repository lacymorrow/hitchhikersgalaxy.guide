import { payload } from "../payload";

// Define common resources and actions
const resources = [
	"team",
	"project",
	"user",
	"api_key",
	"billing",
	"settings",
] as const;

const actions = ["create", "read", "update", "delete", "manage"] as const;

// Define default roles with their permissions
const defaultRoles = [
	{
		name: "Owner",
		description: "Full access to all resources",
		permissions: resources.map((resource) => ({
			resource,
			actions: ["manage"],
		})),
	},
	{
		name: "Admin",
		description: "Administrative access with some restrictions",
		permissions: resources.map((resource) => ({
			resource,
			actions: ["create", "read", "update", "delete"],
		})),
	},
	{
		name: "Member",
		description: "Standard team member access",
		permissions: [
			{
				resource: "team",
				actions: ["read"],
			},
			{
				resource: "project",
				actions: ["read", "update"],
			},
			{
				resource: "user",
				actions: ["read"],
			},
			{
				resource: "api_key",
				actions: ["read", "create"],
			},
			{
				resource: "settings",
				actions: ["read"],
			},
		],
	},
	{
		name: "Viewer",
		description: "Read-only access",
		permissions: resources.map((resource) => ({
			resource,
			actions: ["read"],
		})),
	},
] as const;

export const seedRBAC = async () => {
	try {
		// Clear existing RBAC data
		await payload?.delete({
			collection: "rbac",
			where: {
				id: {
					exists: true,
				},
			},
		});

		// Create all possible permissions first
		const createdPermissions = await Promise.all(
			resources.flatMap((resource) =>
				actions.map(async (action) => {
					const permission = await payload?.create({
						collection: "rbac",
						data: {
							name: `${action}_${resource}`,
							description: `Can ${action} ${resource.replace("_", " ")}`,
							type: "permission",
							resource,
							action,
						},
					});
					return permission;
				}),
			),
		);

		console.info(`✅ Created ${createdPermissions.length} permissions`);

		// Create default roles with their permissions
		const createdRoles = await Promise.all(
			defaultRoles.map(async (roleData) => {
				// Find relevant permissions for this role
				const rolePermissions = createdPermissions.filter((permission) => {
					const rolePerms = roleData.permissions.find(
						(p) => p.resource === permission?.resource,
					);
					return (
						rolePerms &&
						(rolePerms.actions.includes(permission?.action as any) ||
							(rolePerms.actions.includes("manage") &&
								permission?.action === "manage"))
					);
				});

				// Create the role with its permissions
				const role = await payload?.create({
					collection: "rbac",
					data: {
						name: roleData.name,
						description: roleData.description,
						type: "role",
						permissions: rolePermissions.map((p) => p?.id ?? 0), // Ensure id is always a number
					},
				});

				return role;
			}),
		);

		console.info(`✅ Created ${createdRoles.length} roles`);
		return { permissions: createdPermissions, roles: createdRoles };
	} catch (error) {
		console.error("Error seeding RBAC:", error);
		throw error;
	}
};
