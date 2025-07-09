import type { Metadata } from "next";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
	title: "Teams",
	description:
		"Manage your teams and their members. Create, edit, and delete teams to organize your projects and collaborate with others.",
	openGraph: {
		title: `Teams - ${siteConfig.title}`,
		description:
			"Manage your teams and their members. Create, edit, and delete teams to organize your projects and collaborate with others.",
	},
};
