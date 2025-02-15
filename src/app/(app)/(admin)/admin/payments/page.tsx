import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/primitives/page-header";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getPaymentsWithUsers } from "@/lib/lemonsqueezy";
import { columns } from "./_components/columns";

/**
 * Admin payments page component that displays a data table of all payments
 */
export default async function PaymentsPage() {
	const payments = await getPaymentsWithUsers();

	return (
		<div className="container mx-auto py-10">
			<PageHeader>
				<PageHeaderHeading>Payment Management</PageHeaderHeading>
				<PageHeaderDescription>
					View and manage all payments from Lemon Squeezy.
				</PageHeaderDescription>
			</PageHeader>
			<DataTable
				columns={columns}
				data={payments}
				searchPlaceholder="Search payments..."
			/>
		</div>
	);
}
