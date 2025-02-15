import { db } from "@/server/db";

export async function getVercelDetails(userId: string) {
	try {
		// Get Vercel account details
		const vercelAccount = await db.query.accounts.findFirst({
			where: (accounts, { and, eq }) =>
				and(eq(accounts.userId, userId), eq(accounts.provider, "vercel")),
		});

		if (!vercelAccount) {
			return {
				isConnected: false,
			};
		}

		// Get Vercel team details
		const teamResponse = await fetch("https://api.vercel.com/v2/team", {
			headers: {
				Authorization: `Bearer ${vercelAccount.access_token}`,
			},
		});

		if (!teamResponse.ok) {
			console.error("Error fetching Vercel team:", await teamResponse.text());
			return {
				isConnected: true,
				teamId: null,
			};
		}

		const { id: teamId } = await teamResponse.json();

		return {
			isConnected: true,
			teamId,
			projectId: null, // Will be set after project creation
		};
	} catch (error) {
		console.error("Error getting Vercel details:", error);
		return {
			isConnected: false,
		};
	}
}
