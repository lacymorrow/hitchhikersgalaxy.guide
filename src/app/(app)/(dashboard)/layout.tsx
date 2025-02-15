import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import type { ReactNode } from "react";

export default async function Layout({
	children,
}: {
	children: ReactNode;
}) {
	return <DashboardLayout>{children}</DashboardLayout>;
}
