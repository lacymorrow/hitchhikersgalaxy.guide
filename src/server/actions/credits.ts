"use server";

import { auth } from "@/server/auth";
import type { NewCreditTransaction } from "@/server/db/schema";
import { getUserCredits, updateUserCredits } from "@/server/services/credits";

/**
 * Gets the current authenticated user's credit balance.
 * @returns The user's credit balance.
 * @throws Error if the user is not authenticated.
 */
export async function getCurrentUserCredits(): Promise<number> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("User not authenticated");
	}
	return getUserCredits(session.user.id);
}

interface SpendCreditsParams {
	amount: number; // Must be positive, represents the amount to spend
	type: NewCreditTransaction["type"];
	description?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Spends credits from the current authenticated user's balance.
 * @param params - Parameters for spending credits.
 * @throws Error if user not authenticated, amount is not positive, or insufficient credits.
 */
export async function spendUserCredits({
	amount,
	type,
	description,
	metadata,
}: SpendCreditsParams): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("User not authenticated");
	}
	if (amount <= 0) {
		throw new Error("Amount to spend must be positive.");
	}

	await updateUserCredits({
		userId: session.user.id,
		amount: -amount, // Convert to negative for spending
		type,
		description,
		metadata,
	});
}

interface AddCreditsParams {
	amount: number; // Must be positive
	type: NewCreditTransaction["type"]; // e.g., 'purchase', 'bonus'
	description?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Adds credits to the current authenticated user's balance.
 * Typically used after a purchase or for granting bonuses.
 * @param params - Parameters for adding credits.
 * @throws Error if user not authenticated or amount is not positive.
 */
export async function addUserCredits({
	amount,
	type,
	description,
	metadata,
}: AddCreditsParams): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("User not authenticated");
	}
	if (amount <= 0) {
		throw new Error("Amount to add must be positive.");
	}

	await updateUserCredits({
		userId: session.user.id,
		amount: amount, // Positive amount
		type,
		description,
		metadata,
	});
}
