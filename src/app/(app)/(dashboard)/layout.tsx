import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { routes } from "@/config/routes";
import { auth, authenticated } from "@/server/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function Layout({
	children,
}: {
	children: ReactNode;
}) {
	const session = await auth();
	if (!session) {
		redirect(routes.auth.signIn);
	}

	return <DashboardLayout>{children}</DashboardLayout>;
}
