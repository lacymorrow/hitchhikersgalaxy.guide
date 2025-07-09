export const UserRole = {
	admin: "admin",
	user: "user",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * User interface - the canonical source of truth matching the database schema
 * Used as the base for NextAuth session and JWT types
 */
export interface User {
	id: string;
	name: string | null;
	email: string;
	emailVerified: Date | null;
	image: string | null;
	role?: UserRole;
	theme?: "light" | "dark" | "system";
	bio?: string | null;
	githubUsername?: string | null;
	vercelConnectionAttemptedAt?: Date | null;
	createdAt?: Date;
	updatedAt?: Date;
	metadata?: string | null;
	isGuest?: boolean;
	accounts?: {
		provider: string;
		providerAccountId: string;
	}[];
	payloadToken?: string;
}

// Import NextAuth Session type
import type { Session as NextAuthSession } from "next-auth";

// Type guard to check if auth() returned a Session vs NextResponse
export function isSession(
	sessionOrResponse:
		| NextAuthSession
		| { user: null; expires: string }
		| import("next/server").NextResponse<unknown>
		| null
): sessionOrResponse is NextAuthSession {
	return (
		sessionOrResponse !== null &&
		typeof sessionOrResponse === "object" &&
		"user" in sessionOrResponse &&
		"expires" in sessionOrResponse &&
		sessionOrResponse.user !== null
	);
}
