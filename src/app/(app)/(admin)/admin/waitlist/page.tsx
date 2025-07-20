import { Suspense } from "react";
import { WaitlistAdmin } from "./_components/waitlist-admin";

export default function AdminWaitlistPage() {
	return (
		<div className="container mx-auto py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Waitlist Management</h1>
				<p className="text-muted-foreground">View and manage waitlist entries for Shipkit</p>
			</div>

			<Suspense fallback={<div>Loading waitlist data...</div>}>
				<WaitlistAdmin />
			</Suspense>
		</div>
	);
}

export const metadata = {
	title: "Waitlist Management - Shipkit Admin",
	description: "Manage waitlist entries and view analytics",
};
