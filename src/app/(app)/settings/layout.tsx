import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "../../../components/headers/header";
import { auth } from "@/server/auth";

const sidebarNavItems = [
	{
		title: "Profile",
		href: "/settings",
	},
	{
		title: "Appearance",
		href: "/settings/appearance",
	},
	{
		title: "Security",
		href: "/settings/security",
	},
	// Todo: Add notifications
	// {
	// 	title: "Notifications",
	// 	href: "/settings/notifications",
	// },
	{
		title: "Account",
		href: "/settings/account",
	},
] as const;

interface SettingsLayoutProps {
	children: ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
	const session = await auth();

	if (!session) {
		redirect("/sign-in");
	}

	// Convert readonly array to mutable array for SidebarNav
	const navItems = sidebarNavItems.map((item) => ({
		title: item.title,
		href: item.href,
	}));


	return (
		<div className="flex min-h-screen w-full flex-col">
			<Header />
			<main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
				<div className="container space-y-6">
					<div className="space-y-0.5">
						<h2 className="text-2xl font-bold tracking-tight">Settings</h2>
						<p className="text-muted-foreground">
							Manage your account settings and preferences.
						</p>
					</div>
					<Separator className="my-6" />
					<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
						<aside className="lg:w-1/5">
							<SidebarNav items={navItems} />
						</aside>
						<div className="flex-1 lg:max-w-2xl">{children}</div>
					</div>
				</div>
			</main>
		</div>
	);
}
