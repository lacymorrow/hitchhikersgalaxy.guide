"use client";

import { DataTable } from "@/components/ui/data-table/data-table";
import type { LogData } from "@/types/logger";
import { logColumns } from "./columns";

interface LogTableProps {
	data: LogData[];
	isLive?: boolean;
}

export const LogTable = ({ data, isLive = false }: LogTableProps) => {
	return (
		<DataTable
			columns={logColumns}
			data={data}
			className={isLive ? "min-h-[400px]" : undefined}
		/>
	);
};
