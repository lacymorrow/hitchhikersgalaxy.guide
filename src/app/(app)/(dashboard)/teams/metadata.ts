import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Teams",
	description:
		"Manage your teams and their members. Create, edit, and delete teams to organize your projects and collaborate with others.",
	openGraph: {
		title: `Teams - ${siteConfig.name}`,
		description:
			"Manage your teams and their members. Create, edit, and delete teams to organize your projects and collaborate with others.",
	},
};
