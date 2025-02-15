/**
 * Shared metadata for all UI components in this directory
 */
import { siteConfig } from "@/config/site";

export default {
	description: `UI Components for ${siteConfig.name}`,
	categories: [siteConfig.repo.name.toLowerCase()],
	meta: {
		author: siteConfig.name,
		license: "MIT",
		status: "stable" as const,
	},
};
