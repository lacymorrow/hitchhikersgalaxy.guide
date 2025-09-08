import { eq } from "drizzle-orm";
import type { NextAuthConfig } from "next-auth";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { logger } from "@/lib/logger";
import { providers } from "@/server/auth-js/auth-providers.config";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { grantGitHubAccess } from "@/server/services/github/github-service";
import { userService } from "@/server/services/user-service";
import type { User } from "@/types/user";

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
						email: user.email!,
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
						email: user.email!,
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
				if (nextUrl.startsWith("/")) {
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
				// Ensure avatar and other optional properties are persisted on JWT sessions
				const typedUser = user as User;
				if ("image" in typedUser) token.image = typedUser.image;
				if ("role" in typedUser) token.role = typedUser.role;
				// Store dates in JWT as ISO strings to avoid Date type mismatch after serialization
				if ("createdAt" in typedUser)
					token.createdAt = typedUser.createdAt
						? new Date(typedUser.createdAt).toISOString()
						: undefined;
				if ("updatedAt" in typedUser)
					token.updatedAt = typedUser.updatedAt
						? new Date(typedUser.updatedAt).toISOString()
						: undefined;

				// Mark as guest user if the account provider is guest
				if (account?.provider === "guest") {
					token.isGuest = true;
				}

				// Safely access optional properties
				if ("bio" in typedUser) token.bio = typedUser.bio;
				if ("githubUsername" in typedUser) token.githubUsername = typedUser.githubUsername;
				if ("theme" in typedUser) token.theme = typedUser.theme;
				if ("emailVerified" in typedUser)
					token.emailVerified = typedUser.emailVerified
						? new Date(typedUser.emailVerified).toISOString()
						: null;
				if ("vercelConnectionAttemptedAt" in typedUser)
					token.vercelConnectionAttemptedAt = typedUser.vercelConnectionAttemptedAt
						? new Date(typedUser.vercelConnectionAttemptedAt).toISOString()
						: null;

				// Store Payload CMS token if available (not for guest users)
				if (
					"payloadToken" in typedUser &&
					typeof typedUser.payloadToken === "string" &&
					!token.isGuest
				) {
					token.payloadToken = typedUser.payloadToken;
				}
			}

			// Save GitHub access token when signing in with GitHub and update database
			if (account?.provider === "github" && account.access_token && user?.id) {
				token.githubAccessToken = account.access_token;

				// If we have a GitHub username from the profile, store it directly
				// This is important for handling first-time GitHub OAuth logins
				const githubUser = user as User;
				if (user && githubUser.githubUsername) {
					token.githubUsername = githubUser.githubUsername;
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
							const githubUser = user as User;
							await db
								?.update(users)
								.set({
									githubUsername: githubUser.githubUsername || null,
									metadata: JSON.stringify(newMetadata),
									updatedAt: new Date(),
								})
								.where(eq(users.id, user.id));

							// If we have a username, try to grant access to the repository
							const githubUsername = githubUser.githubUsername;
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
					token.vercelConnectionAttemptedAt = new Date(
						session.vercelConnectionAttemptedAt
					).toISOString();
			}
			return token;
		},
		async session({ session, token, user }) {
			// Map from JWT token when present (JWT strategy)
			if (token?.id) {
				session.user.id = token.id as string;
				session.user.name = token.name as string | null;
				session.user.email = token.email ?? "";
				// Normalize dates coming from JWT (which serializes Dates to ISO strings)
				session.user.emailVerified = token.emailVerified
					? new Date(token.emailVerified as unknown as string | number | Date)
					: null;
				session.user.image = (token.image as string | null) ?? session.user.image ?? null;
				session.user.role = token.role as import("@/types/user").UserRole;
				session.user.theme = token.theme as "light" | "dark" | "system" | undefined;
				session.user.bio = token.bio as string | null;
				session.user.githubUsername = token.githubUsername as string | null;
				session.user.vercelConnectionAttemptedAt = token.vercelConnectionAttemptedAt
					? new Date(token.vercelConnectionAttemptedAt as unknown as string | number | Date)
					: null;
				session.user.createdAt = token.createdAt
					? new Date(token.createdAt as unknown as string | number | Date)
					: undefined;
				session.user.updatedAt = token.updatedAt
					? new Date(token.updatedAt as unknown as string | number | Date)
					: undefined;
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

			// When using database session strategy, populate from the database user
			if (!token?.id && user) {
				const typedUser = user as User;
				session.user.id = typedUser.id;
				session.user.name = typedUser.name;
				session.user.email = typedUser.email ?? "";
				session.user.emailVerified = typedUser.emailVerified ?? null;
				session.user.image = typedUser.image ?? null;
				session.user.role = typedUser.role ?? session.user.role;
				session.user.theme = typedUser.theme ?? session.user.theme;
				session.user.bio = typedUser.bio ?? session.user.bio;
				session.user.githubUsername = typedUser.githubUsername ?? session.user.githubUsername;
				session.user.createdAt = typedUser.createdAt ?? session.user.createdAt;
				session.user.updatedAt = typedUser.updatedAt ?? session.user.updatedAt;
				// Accounts will be fetched below
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
