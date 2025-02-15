import { Suspense } from "react";
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/primitives/page-header";
import { DataTable } from "@/components/ui/data-table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { getCollaboratorDetails } from "@/server/services/github/github-service";
import { columns } from "./_components/columns";
import type { GitHubUserData } from "./_components/columns";

function GitHubUsersTableSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-10 w-[250px]" />
			<div className="rounded-md border">
				<div className="h-24 rounded-md" />
			</div>
		</div>
	);
}

async function GitHubUsersTableContent() {
	if (!db) throw new Error("Database connection not initialized");

	// Fetch users with GitHub usernames
	const githubUsers = await db.query.users.findMany({
		where: (users, { isNotNull }) => isNotNull(users.githubUsername),
		columns: {
			id: true,
			email: true,
			name: true,
			githubUsername: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	// Fetch GitHub details for each user
	const usersWithDetails = await Promise.all(
		githubUsers.map(async (user) => {
			if (!user.githubUsername) return user;
			const details = await getCollaboratorDetails(user.githubUsername);
			return {
				...user,
				githubDetails: details,
			};
		}),
	);

	return (
		<DataTable
			columns={columns}
			data={usersWithDetails}
			searchPlaceholder="Search GitHub users..."
		/>
	);
}

export default function GitHubUsersPage() {
	return (
		<div className="container mx-auto py-10">
			<PageHeader>
				<PageHeaderHeading>GitHub Users</PageHeaderHeading>
				<PageHeaderDescription>
					View and manage users with GitHub repository access.
				</PageHeaderDescription>
			</PageHeader>
			<Suspense fallback={<GitHubUsersTableSkeleton />}>
				<GitHubUsersTableContent />
			</Suspense>
		</div>
	);
}
