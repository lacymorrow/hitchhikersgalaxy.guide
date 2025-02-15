"use client";

import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Suspense } from "react";

export interface ApiKey {
	id: string;
	key: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	lastUsedAt: Date | null;
	expiresAt: Date | null;
	deletedAt: Date | null;
	userId: string | null;
	projectId: string | null;
}

const columns: ColumnDef<ApiKey>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => (
			<div className="truncate" title={row.getValue("name")}>
				{row.getValue("name")}
			</div>
		),
	},
	{
		accessorKey: "key",
		header: "API Key",
		cell: ({ row }) => (
			<div className="truncate" title={row.getValue("key")}>
				{row.getValue("key")}
			</div>
		),
	},
	{
		accessorKey: "createdAt",
		header: "Created At",
		cell: ({ row }) => {
			const createdAt = row.getValue("createdAt") as Date;
			return (
				<div
					className="truncate"
					title={createdAt.toLocaleString()}
				>
					{createdAt.toLocaleString()}
				</div>
			);
		},
	},
	{
		accessorKey: "lastUsedAt",
		header: "Last Used",
		cell: ({ row }) => {
			const lastUsedAt = row.getValue("lastUsedAt") as Date | null;
			return lastUsedAt ? (
				<div
					className="truncate"
					title={lastUsedAt.toLocaleString()}
				>
					{lastUsedAt.toLocaleString()}
				</div>
			) : (
				<div className="text-muted-foreground">Never</div>
			);
		},
	},
	{
		accessorKey: "expiresAt",
		header: "Expires At",
		cell: ({ row }) => {
			const expiresAt = row.getValue("expiresAt") as Date | null;
			return expiresAt ? (
				<div
					className="truncate"
					title={expiresAt.toLocaleString()}
				>
					{expiresAt.toLocaleString()}
				</div>
			) : (
				<div className="text-muted-foreground">Never</div>
			);
		},
	},
];

interface ApiKeysTableProps {
	data: ApiKey[];
}

export function ApiKeysTable({ data }: ApiKeysTableProps) {
	return (
		<Suspense fallback={<SuspenseFallback />}>
			<DataTable
				columns={columns}
				data={data}
			/>
		</Suspense>
	);
}
