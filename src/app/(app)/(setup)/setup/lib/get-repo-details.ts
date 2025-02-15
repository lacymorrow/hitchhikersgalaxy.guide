import { siteConfig } from "@/config/site";

export async function getRepoDetails() {
	// Get repository details from site config or environment variables
	return {
		owner: process.env.GITHUB_TEMPLATE_OWNER || siteConfig.repo.owner,
		name: process.env.GITHUB_TEMPLATE_NAME || "lacy.is",
		url:
			process.env.GITHUB_TEMPLATE_URL ||
			"https://github.com/lacymorrow/lacy.is",
	};
}
