import { db } from "@/server/db";

export async function getGitHubDetails(userId: string) {
	try {
		// Get GitHub account details
		const githubAccount = await db.query.accounts.findFirst({
			where: (accounts, { and, eq }) =>
				and(eq(accounts.userId, userId), eq(accounts.provider, "github")),
		});

		if (!githubAccount) {
			return {
				isConnected: false,
				user: null,
			};
		}

		// Get GitHub user details using the access token
		const userResponse = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${githubAccount.access_token}`,
				Accept: "application/vnd.github.v3+json",
			},
		});

		if (!userResponse.ok) {
			console.error("Error fetching GitHub user:", await userResponse.text());
			return {
				isConnected: false,
				user: null,
			};
		}

		const user = await userResponse.json();

		return {
			isConnected: true,
			user,
			username: user.login,
		};
	} catch (error) {
		console.error("Error getting GitHub details:", error);
		return {
			isConnected: false,
			user: null,
		};
	}
}
