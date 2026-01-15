"use server";

import { eq } from "drizzle-orm";
import { safeDbExecute } from "@/server/db";
import {
	accounts,
	apiKeys,
	creditTransactions,
	deployments,
	payments,
	teamMembers,
	userCredits,
	users,
} from "@/server/db/schema";
import {
	getAdminDomains as getAdminDomainsService,
	getAdminEmails as getAdminEmailsService,
	isAdmin,
} from "@/server/services/admin-service";

/**
 * Server action to check if a user is an admin
 * This keeps admin checking logic on the server side for security
 *
 * @param email The email address to check
 * @returns Boolean indicating if the email belongs to an admin
 */
export async function checkIsAdmin(email?: string | null): Promise<boolean> {
	return isAdmin({ email });
}

/**
 * Server action to get admin emails (for authorized users only)
 * Should only be called after verifying the requester is an admin
 *
 * @param requestingEmail The email of the user requesting the admin list
 * @returns Array of admin emails if requester is admin, empty array otherwise
 */
export async function getAdminEmails(requestingEmail?: string | null): Promise<string[]> {
	return getAdminEmailsService(requestingEmail);
}

/**
 * Server action to get admin domains (for authorized users only)
 * Should only be called after verifying the requester is an admin
 *
 * @param requestingEmail The email of the user requesting the admin domains
 * @returns Array of admin domains if requester is admin, empty array otherwise
 */
export async function getAdminDomains(requestingEmail?: string | null): Promise<string[]> {
	return getAdminDomainsService(requestingEmail);
}

/**
 * Complete user data for admin view including all related records
 */
export interface CompleteUserData {
	user: typeof users.$inferSelect | null;
	accounts: (typeof accounts.$inferSelect)[];
	payments: (typeof payments.$inferSelect)[];
	deployments: (typeof deployments.$inferSelect)[];
	apiKeys: (typeof apiKeys.$inferSelect)[];
	credits: (typeof userCredits.$inferSelect) | null;
	creditTransactions: (typeof creditTransactions.$inferSelect)[];
	teamMemberships: (typeof teamMembers.$inferSelect)[];
}

/**
 * Server action to get complete user data for admin dashboard
 * Includes all related records: accounts, payments, deployments, API keys, credits, etc.
 *
 * @param userId The ID of the user to fetch data for
 * @returns Complete user data including all related records
 */
export async function getCompleteUserData(userId: string): Promise<CompleteUserData> {
	const emptyResult: CompleteUserData = {
		user: null,
		accounts: [],
		payments: [],
		deployments: [],
		apiKeys: [],
		credits: null,
		creditTransactions: [],
		teamMemberships: [],
	};

	return safeDbExecute(async (db) => {
		const [
			user,
			userAccounts,
			userPayments,
			userDeployments,
			userApiKeys,
			userCreditsData,
			userCreditTransactions,
			userTeamMemberships,
		] = await Promise.all([
			db.select().from(users).where(eq(users.id, userId)).limit(1).then((rows) => rows[0] ?? null),
			db.select().from(accounts).where(eq(accounts.userId, userId)),
			db.select().from(payments).where(eq(payments.userId, userId)),
			db.select().from(deployments).where(eq(deployments.userId, userId)),
			db.select().from(apiKeys).where(eq(apiKeys.userId, userId)),
			db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1).then((rows) => rows[0] ?? null),
			db.select().from(creditTransactions).where(eq(creditTransactions.userId, userId)),
			db.select().from(teamMembers).where(eq(teamMembers.userId, userId)),
		]);

		return {
			user,
			accounts: userAccounts,
			payments: userPayments,
			deployments: userDeployments,
			apiKeys: userApiKeys,
			credits: userCreditsData,
			creditTransactions: userCreditTransactions,
			teamMemberships: userTeamMemberships,
		};
	}, emptyResult);
}
