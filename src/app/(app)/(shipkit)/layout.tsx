import type React from "react";
import { ExtendedHeader } from "@/components/headers/extended-header";
import MainLayout from "@/components/layouts/main-layout";
import { auth } from "@/server/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
	const session = await auth();

	return (
		<MainLayout header={<ExtendedHeader user={session?.user} variant="floating" />}>
			{children}
		</MainLayout>
	);
}
