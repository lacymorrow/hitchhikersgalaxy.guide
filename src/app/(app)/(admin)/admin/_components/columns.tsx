"use client";

import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { Purchase } from "./user-drawer";

const formatDate = (date: Date | null) => {
	return date ? format(date, "MMM d, yyyy") : "N/A";
};

export interface UserData {
	id: string;
	email: string;
	name: string | null;
	createdAt: Date;
	hasPaid: boolean;
	lastPurchaseDate: Date | null;
	totalPurchases: number;
	purchases?: Purchase[];
}

export const columns: ColumnDef<UserData | null>[] = [
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }) => row.original?.email ?? "N/A",
	},
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => row.original?.name ?? "N/A",
	},
	{
		accessorKey: "createdAt",
		header: "Joined",
		cell: ({ row }) => formatDate(row.original?.createdAt ?? null),
	},
	{
		accessorKey: "hasPaid",
		header: "Payment Status",
		cell: ({ row }) => (
			<Badge variant={row.original?.hasPaid ? "default" : "secondary"}>
				{row.original?.hasPaid ? "Paid" : "Not Paid"}
			</Badge>
		),
	},
	{
		accessorKey: "lastPurchaseDate",
		header: "Last Purchase",
		cell: ({ row }) => formatDate(row.original?.lastPurchaseDate ?? null),
	},
	{
		accessorKey: "totalPurchases",
		header: "Total Purchases",
		cell: ({ row }) => row.original?.totalPurchases ?? 0,
	},
];
