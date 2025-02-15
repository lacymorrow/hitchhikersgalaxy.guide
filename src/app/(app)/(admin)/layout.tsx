import { Header } from "@/components/headers/header";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import type React from "react";

const navLinks = [
	{ href: routes.admin.users, label: "Users" },
	{ href: routes.admin.github, label: "GitHub" },
	{ href: routes.admin.cms, label: "CMS" },
	{ href: routes.admin.feedback, label: "Feedback" },
	{ href: routes.admin.payments, label: "Payments" },
	{ href: routes.admin.ai, label: "AI" },
];


export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	const isAdmin =
		session?.user?.email && siteConfig.admin.isAdmin(session.user.email);

	if (!isAdmin) {
		redirect(routes.home);
	}

	return (
		<>
			<Header navLinks={navLinks} />
			{children}
		</>
	);
}
