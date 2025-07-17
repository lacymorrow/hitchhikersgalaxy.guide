import { eq } from "drizzle-orm";
import type { NextAuthConfig } from "next-auth";
import { routes } from "@/config/routes";
import { logger } from "@/lib/logger";
import { providers } from "@/server/auth-providers.config";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { grantGitHubAccess } from "@/server/services/github/github-service";
import { userService } from "@/server/services/user-service";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthConfig = {
	debug: process.env.DEBUG_AUTH === "true",
	providers,
	pages: {
		error: routes.auth.error,
		signIn: routes.auth.signIn,
		signOut: routes.auth.signOut,
	},
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
		updateAge: 24 * 60 * 60, // 24 hours
	},
	// cookies: {
	// 	sessionToken: {
	// 		name:
	// 			process.env.NODE_ENV === "production"
	// 				? "__Secure-next-auth.session-token"
	// 				: "next-auth.session-token",
	// 		options: {
	// 			httpOnly: true,
	// 			sameSite: "lax",
	// 			path: "/",
	// 			secure: process.env.NODE_ENV === "production",
	// 		},
	// 	},
	// },
	callbacks: {
		async signIn({ user, account, profile }) {
			if (!user.id) return false;

			// Handle guest user sign-in
			if (account?.provider === "guest") {
				return true; // Always allow guest sign-in
			}

			// Handle GitHub OAuth connection
			if (account?.provider === "github" && account.access_token) {
				// Note: We don't call connectGitHub here because the session doesn't exist yet
				// The GitHub connection information is handled in the JWT callback
				return true;
			}

			// Special handling for credentials provider
			// This ensures the user exists in both databases and handles session creation properly
			if (account?.provider === "credentials") {
				// The user should already exist in both databases from validateCredentials
				// Just return true to allow sign in
				return true;
			}

			// For OAuth providers, use profile data to ensure user exists and is up to date
			// This handles cases where a user was created through OAuth but profile info changed
			if (account?.provider && profile) {
				try {
					await userService.ensureUserExists({
						id: user.id,
						email: user.email as string,
						name: profile.name || user.name, // Use profile name if available
						image: profile.image || profile.picture || user.image, // Use profile image if available
					});
				} catch (error) {
					console.error("Error ensuring user exists in Shipkit database:", error);
					// Don't fail the sign-in if this fails, just log the error
				}
			} else {
				// Fallback for non-OAuth providers
				try {
					await userService.ensureUserExists({
						id: user.id,
						email: user.email as string,
						name: user.name,
						image: user.image,
					});
				} catch (error) {
					console.error("Error ensuring user exists in Shipkit database:", error);
					// Don't fail the sign-in if this fails, just log the error
				}
			}

			// Log the sign in activity
			return true;
		},
		async redirect({ url, baseUrl }) {
			// Handle the nextUrl parameter for redirects
			const redirectUrl = new URL(url, baseUrl);
			const nextUrl = redirectUrl.searchParams.get(SEARCH_PARAM_KEYS.nextUrl);

			if (nextUrl) {
				// Ensure it's a relative URL for security
				if (nextUrl.startsWith('/')) {
					return `${baseUrl}${nextUrl}`;
				}
			}

			// Default redirect
			if (url.startsWith("/")) return `${baseUrl}${url}`;
			if (new URL(url).origin === baseUrl) return url;
			return baseUrl;
		},
		jwt({ token, user, account, trigger, session }) {
			// Save user data to the token
			if (user) {
				token.id = user.id;
				token.name = user.name;
				token.email = user.email;

				// Mark as guest user if the account provider is guest
				if (account?.provider === "guest") {
					token.isGuest = true;
				}

				// Safely access optional properties
				if ("bio" in user) token.bio = user.bio as string | null;
				if ("githubUsername" in user) token.githubUsername = user.githubUsername as string | null;
				if ("theme" in user) token.theme = user.theme as "light" | "dark" | "system" | undefined;
				if ("emailVerified" in user) token.emailVerified = user.emailVerified as Date | null;
				if ("vercelConnectionAttemptedAt" in user)
					token.vercelConnectionAttemptedAt = user.vercelConnectionAttemptedAt as Date | null;

				// Store Payload CMS token if available (not for guest users)
				if ("payloadToken" in user && typeof user.payloadToken === "string" && !token.isGuest) {
					token.payloadToken = user.payloadToken;
				}
			}

			// Save GitHub access token when signing in with GitHub and update database
			if (account?.provider === "github" && account.access_token && user?.id) {
				token.githubAccessToken = account.access_token;

				// If we have a GitHub username from the profile, store it directly
				// This is important for handling first-time GitHub OAuth logins
				if (user && (user as any).githubUsername) {
					token.githubUsername = (user as any).githubUsername;
				}

				// Update the database with GitHub connection information
				// This happens in the JWT callback where we have access to the user ID and account data
				(async () => {
					try {
						// Get current user metadata
						if (!user.id) {
							return;
						}

						// Get current user metadata
						const currentUser = await db?.query.users.findFirst({
							where: eq(users.id, user.id),
						});

						if (currentUser) {
							// Parse existing metadata or create new object
							const currentMetadata = currentUser.metadata ? JSON.parse(currentUser.metadata) : {};

							// Update metadata with GitHub info
							const newMetadata = {
								...currentMetadata,
								providers: {
									...currentMetadata.providers,
									github: {
										id: account.providerAccountId,
										accessToken: account.access_token,
									},
								},
							};

							// Update user record with GitHub connection
							await db
								?.update(users)
								.set({
									githubUsername: (user as any).githubUsername || null,
									metadata: JSON.stringify(newMetadata),
									updatedAt: new Date(),
								})
								.where(eq(users.id, user.id));

							// If we have a username, try to grant access to the repository
							const githubUsername = (user as any).githubUsername;
							if (githubUsername) {
								try {
									await grantGitHubAccess({ githubUsername });
									logger.info("Successfully granted GitHub repository access", {
										userId: user.id,
										githubUsername,
									});
								} catch (grantError) {
									console.error("Error granting repository access:", grantError);
									// Don't fail the connection if repo access fails
								}
							}
						}
					} catch (error) {
						console.error("Error updating GitHub connection in database:", error);
						// Don't fail the JWT creation if this fails
					}
				})();
			}

			// Handle direct GitHub username updates passed from session update
			// This is critical for UI updates when connecting or disconnecting GitHub
			if (session?.user?.githubUsername !== undefined) {
				token.githubUsername = session.user.githubUsername;
			}

			// Handle account updates directly from session
			if (session?.user?.accounts) {
				token.accounts = session.user.accounts;
			}

			// Handle Payload token updates in session
			if (session?.payloadToken && typeof session.payloadToken === "string") {
				token.payloadToken = session.payloadToken;
			}

			// Handle updates
			if (trigger === "update" && session) {
				if (session.theme) token.theme = session.theme;
				if (session.name) token.name = session.name;
				if (session.bio) token.bio = session.bio;
				if (session.payloadToken && typeof session.payloadToken === "string")
					token.payloadToken = session.payloadToken;
				if (session.vercelConnectionAttemptedAt)
					token.vercelConnectionAttemptedAt = session.vercelConnectionAttemptedAt;
			}
			return token;
		},
		async session({ session, token, user }) {
			if (token) {
				session.user.id = token.id as string;
				session.user.name = token.name as string | null;
				session.user.email = token.email ?? "";
				session.user.emailVerified = token.emailVerified as Date | null;
				session.user.image = token.image as string | null;
				session.user.role = token.role as import("@/types/user").UserRole;
				session.user.theme = token.theme as "light" | "dark" | "system" | undefined;
				session.user.bio = token.bio as string | null;
				session.user.githubUsername = token.githubUsername as string | null;
				session.user.vercelConnectionAttemptedAt = token.vercelConnectionAttemptedAt as Date | null;
				session.user.createdAt = token.createdAt as Date | undefined;
				session.user.updatedAt = token.updatedAt as Date | undefined;
				session.user.metadata = token.metadata as string | null;
				session.user.isGuest = token.isGuest as boolean | undefined;
				session.user.accounts = token.accounts as {
					provider: string;
					providerAccountId: string;
				}[];
				if (token.payloadToken && typeof token.payloadToken === "string" && !token.isGuest) {
					session.user.payloadToken = token.payloadToken;
				}
			}

			// If token didn't have accounts and we have a user from database, fetch accounts
			// Skip this for guest users as they don't have database entries
			if (!session.user.accounts && user && !session.user.isGuest) {
				// Fetch user accounts from database
				try {
					const accounts = await db?.query.accounts.findMany({
						where: (accounts, { eq }) => eq(accounts.userId, user.id),
						columns: {
							provider: true,
							providerAccountId: true,
						},
					});

					if (accounts) {
						session.user.accounts = accounts;
					}
				} catch (error) {
					console.error("Error fetching user accounts:", error);
				}
			}

			return session;
		},
	},
} satisfies NextAuthConfig;
