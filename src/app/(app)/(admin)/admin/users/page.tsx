import { Suspense } from "react";

import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/primitives/page-header";
import { DataTable } from "@/components/ui/data-table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getUsersWithPayments } from "@/lib/lemonsqueezy";
import { columns } from "../_components/columns";

function UsersTableSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-10 w-[250px]" />
			<div className="rounded-md border">
				<div className="h-24 rounded-md" />
			</div>
		</div>
	);
}

async function UsersTableContent() {
	const users = await getUsersWithPayments();

	return (
		<DataTable
			columns={columns}
			data={users}
			searchPlaceholder="Search users..."
		/>
	);
}

/**
 * Admin page component that displays a data table of users and their payment status
 */
export default function AdminPage() {
	return (
		<div className="container mx-auto py-10">
			<PageHeader>
				<PageHeaderHeading>User Management</PageHeaderHeading>
				<PageHeaderDescription>
					View and manage all users in your database.
				</PageHeaderDescription>
			</PageHeader>			<Suspense fallback={<UsersTableSkeleton />}>
				<UsersTableContent />
			</Suspense>
		</div>
	);
}
