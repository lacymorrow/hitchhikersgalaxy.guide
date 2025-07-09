import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { BASE_URL } from "@/config/base-url";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { auth } from "@/server/auth";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";

export default async function Layout({ children }: { children: ReactNode }) {
	const session = await auth();
	console.log("session", session?.user);
	// !todo this didn't work
	if (!session?.user) {
		// "Redirect to sign in" so they will be directed back after.
		const url = new URL(routes.auth.signIn, BASE_URL);
		url.searchParams.set(SEARCH_PARAM_KEYS.nextUrl, routes.app.dashboard);
		redirect(url.toString());
	}
	return (
		<DashboardLayout>
			<Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
		</DashboardLayout>
	);
}
