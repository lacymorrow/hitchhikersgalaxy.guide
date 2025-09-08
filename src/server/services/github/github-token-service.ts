import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { accounts, users } from "@/server/db/schema";

/**
 * Get the GitHub access token for the currently authenticated user
 * @returns The GitHub access token or null if not found
 */
export async function getGitHubAccessToken(userId?: string): Promise<string | null> {
	try {
		// If no userId provided, get from current session
		if (!userId) {
			const session = await auth();
			if (!session?.user?.id) {
				return null;
			}
			userId = session.user.id;
		}

		// First, try to get the token from the accounts table
		const account = await db?.query.accounts.findFirst({
			where: (accounts, { and, eq }) =>
				and(eq(accounts.userId, userId!), eq(accounts.provider, "github")),
		});

		if (account?.access_token) {
			return account.access_token;
		}

		// Fallback: check user metadata
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (user?.metadata) {
			try {
				const metadata = JSON.parse(user.metadata);
				if (metadata?.providers?.github?.accessToken) {
					return metadata.providers.github.accessToken;
				}
			} catch (error) {
				console.error("Error parsing user metadata:", error);
			}
		}

		return null;
	} catch (error) {
		console.error("Error retrieving GitHub access token:", error);
		return null;
	}
}

/**
 * Check if the user has connected their GitHub account
 * @returns True if GitHub is connected, false otherwise
 */
export async function hasGitHubConnection(userId?: string): Promise<boolean> {
	const token = await getGitHubAccessToken(userId);
	return token !== null;
}

/**
 * Get the GitHub username for the currently authenticated user
 * @returns The GitHub username or null if not found
 */
export async function getGitHubUsername(userId?: string): Promise<string | null> {
	try {
		// If no userId provided, get from current session
		if (!userId) {
			const session = await auth();
			if (!session?.user?.id) {
				return null;
			}
			userId = session.user.id;
		}

		// Get the user's GitHub username
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
		});

		return user?.githubUsername || null;
	} catch (error) {
		console.error("Error retrieving GitHub username:", error);
		return null;
	}
}
