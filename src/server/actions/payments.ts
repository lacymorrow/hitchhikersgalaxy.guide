/**
 * @fileoverview Server actions for payment processing and management
 * @module server/actions/payments
 * 
 * This file handles all payment-related server actions including:
 * - Creating payment records from webhooks
 * - Importing payments from external providers
 * - Managing payment access and verification
 * - Administrative payment operations
 * 
 * Key responsibilities:
 * - Process webhook events from payment providers (Lemon Squeezy, Stripe, Polar)
 * - Grant user access based on successful payments
 * - Synchronize payment data with external providers
 * - Enforce rate limiting to prevent abuse
 * - Provide admin tools for payment management
 * 
 * Dependencies:
 * - PaymentService: Core payment business logic
 * - RateLimitService: Prevent API abuse
 * - Multiple payment provider integrations
 * 
 * @security All actions require authentication except webhook handlers
 * @security Rate limiting applied to prevent abuse
 * @security Admin actions require admin role verification
 */

"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { payments, users } from "@/server/db/schema";
import { getProvider } from "@/server/providers";
import { isAdmin } from "@/server/services/admin-service";
import { PaymentService } from "@/server/services/payment-service";
import { RateLimitService } from "@/server/services/rate-limit-service";
import type { ImportProvider, ImportStats } from "@/types/payments";

// Rate limiting service instance - prevents API abuse
const rateLimitService = new RateLimitService();

/**
 * Rate limit configurations for payment actions
 * Prevents abuse and ensures system stability
 */
const rateLimits = {
	importPayments: {
		requests: 5, // Limited due to high processing cost
		duration: 60 * 30, // 30 minutes window
	},
	createPayment: {
		requests: 10, // Moderate limit for webhook processing
		duration: 60 * 5, // 5 minutes window
	},
	getPayments: {
		requests: 20, // Higher limit for read operations
		duration: 60 * 5, // 5 minutes window
	},
	getAllPayments: {
		requests: 10, // Admin operation with stricter limit
		duration: 60 * 10, // 10 minutes window
	},
};

/**
 * Creates a payment record from LemonSqueezy webhook and grants user access
 * 
 * @param data - Payment data from LemonSqueezy webhook
 * @param data.orderId - LemonSqueezy order ID
 * @param data.orderIdentifier - Order identifier for lookup
 * @param data.userId - Optional user ID (from custom data or session)
 * @param data.userEmail - User email for account lookup
 * @param data.customData - Custom data passed during checkout
 * 
 * @returns Success status and optional error message
 * 
 * @remarks
 * This is typically called from webhook handlers after payment verification.
 * It handles user account creation if needed and grants appropriate access.
 * 
 * @security No authentication required as this is called from webhooks
 * @security Payment data must be verified before calling this action
 */
export async function createLemonSqueezyPayment(data: {
	orderId: string;
	orderIdentifier: string;
	userId?: string;
	userEmail?: string;
	customData?: {
		user_id?: string;
		user_email?: string;
	};
	status: string;
	total: number;
	productName: string;
}) {
	// Check if the LemonSqueezy feature is enabled
	if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
		logger.error("LemonSqueezy feature is disabled. Cannot create payment.");
		throw new Error("LemonSqueezy payments are not enabled.");
	}

	const requestId = crypto.randomUUID();
	const startTime = Date.now();

	logger.info("LemonSqueezy payment creation request received", {
		requestId,
		timestamp: new Date().toISOString(),
		orderId: data.orderId,
		userId: data.userId,
		status: data.status,
	});

	try {
		// Check if database is initialized
		if (!db) {
			logger.error("Database not initialized", { requestId });
			throw new Error("Database not initialized");
		}

		// Only process paid orders
		if (data.status !== "paid") {
			logger.warn("Order not paid", {
				requestId,
				orderId: data.orderId,
				status: data.status,
			});
			throw new Error("Order not paid");
		}

		// Use either the session user ID or the custom data user ID
		let actualUserId = data.userId || data.customData?.user_id;

		// If no user ID is provided, try to find or create user by email
		if (!actualUserId) {
			const userEmail = data.userEmail || data.customData?.user_email;

			if (!userEmail) {
				logger.error("No user ID or email found", {
					requestId,
					orderId: data.orderId,
					userId: data.userId,
					userEmail: data.userEmail,
					customData: data.customData,
				});
				throw new Error("No user ID or email found");
			}

			logger.info("No user ID provided, attempting to find/create user by email", {
				requestId,
				orderId: data.orderId,
				userEmail,
			});

			// Check if this order already exists (duplicate prevention)
			const existingPayment = await db.query.payments.findFirst({
				where: eq(payments.orderId, data.orderId),
			});

			if (existingPayment) {
				logger.info("Payment already exists, checking for missing user ID", {
					requestId,
					orderId: data.orderId,
					existingPaymentId: existingPayment.id,
					existingUserId: existingPayment.userId,
				});

				// If existing payment has no user ID, update it
				if (!existingPayment.userId) {
					// Find or create user by email
					let existingUser = await db.query.users.findFirst({
						where: eq(users.email, userEmail.toLowerCase()),
					});

					if (!existingUser) {
						const [newUser] = await db
							.insert(users)
							.values({
								email: userEmail.toLowerCase(),
								name: null,
								emailVerified: new Date(), // Consider email verified since they made a purchase
							})
							.returning();
						existingUser = newUser;

						logger.info("Created new user for existing payment", {
							requestId,
							orderId: data.orderId,
							userId: existingUser.id,
							email: userEmail,
						});
					}

					// Update existing payment with user ID
					await db
						.update(payments)
						.set({
							userId: existingUser.id,
							updatedAt: new Date(),
						})
						.where(eq(payments.orderId, data.orderId));

					logger.info("Updated existing payment with user ID", {
						requestId,
						orderId: data.orderId,
						paymentId: existingPayment.id,
						userId: existingUser.id,
					});

					return { success: true, paymentId: existingPayment.id };
				}

				logger.info("Payment already exists and has user ID", {
					requestId,
					orderId: data.orderId,
					paymentId: existingPayment.id,
				});

				return { success: true, paymentId: existingPayment.id };
			}

			// Find or create user by email
			let existingUser = await db.query.users.findFirst({
				where: eq(users.email, userEmail.toLowerCase()),
			});

			if (!existingUser) {
				const [newUser] = await db
					.insert(users)
					.values({
						email: userEmail.toLowerCase(),
						name: null,
						emailVerified: new Date(), // Consider email verified since they made a purchase
					})
					.returning();
				existingUser = newUser;

				logger.info("Created new user for payment", {
					requestId,
					orderId: data.orderId,
					userId: existingUser.id,
					email: userEmail,
				});
			}

			actualUserId = existingUser.id;
		}

		// Create payment using the existing service method
		const payment = await PaymentService.createPayment({
			userId: actualUserId,
			orderId: data.orderId,
			amount: data.total,
			status: "completed",
			processor: "lemonsqueezy",
			metadata: {
				// Store product information at top level for easy access
				productName: data.productName || "Unknown Product",
				product_name: data.productName || "Unknown Product",

				// Store order details
				orderIdentifier: data.orderIdentifier,
				userEmail: data.userEmail || data.customData?.user_email,
				customData: data.customData,
			},
		});

		if (!payment) {
			logger.error("Failed to create payment", {
				requestId,
				orderId: data.orderId,
				userId: actualUserId,
			});
			throw new Error("Failed to create payment");
		}

		const processingTime = Date.now() - startTime;
		logger.info("LemonSqueezy payment created successfully", {
			requestId,
			orderId: data.orderId,
			userId: actualUserId,
			paymentId: payment.id,
			processingTime,
		});

		return { success: true, paymentId: payment.id };
	} catch (error) {
		const processingTime = Date.now() - startTime;
		logger.error("Error creating LemonSqueezy payment", {
			requestId,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			processingTime,
		});
		throw error;
	}
}

/**
 * Server action to check if a user has purchased a specific variant (for Lemon Squeezy)
 */
export async function checkUserPurchasedVariant(
	variantId: string,
	provider?: "lemonsqueezy" | "polar"
): Promise<{ success: boolean; purchased: boolean; message?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, purchased: false, message: "Not authenticated" };
		}
		const userId = session.user.id;

		const purchased = await PaymentService.hasUserPurchasedVariant({
			userId,
			variantId,
			provider,
		});

		return { success: true, purchased };
	} catch (error) {
		console.error("Error checking variant purchase:", error);
		return {
			success: false,
			purchased: false,
			message: "Failed to check purchase status",
		};
	}
}

/**
 * Server action to check if a user has purchased a specific product
 */
export async function checkUserPurchasedProduct(
	productId: string,
	provider?: "lemonsqueezy" | "polar"
): Promise<{ success: boolean; purchased: boolean; message?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, purchased: false, message: "Not authenticated" };
		}
		const userId = session.user.id;

		const purchased = await PaymentService.hasUserPurchasedProduct({
			userId,
			productId,
			provider,
		});

		return { success: true, purchased };
	} catch (error) {
		console.error("Error checking product purchase:", error);
		return {
			success: false,
			purchased: false,
			message: "Failed to check purchase status",
		};
	}
}

/**
 * Server action to check if a user has an active subscription
 */
export async function checkUserSubscription(
	provider?: "lemonsqueezy" | "polar"
): Promise<{ success: boolean; hasSubscription: boolean; message?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, hasSubscription: false, message: "Not authenticated" };
		}

		const hasSubscription = await PaymentService.hasUserActiveSubscription({
			userId: session.user.id,
			provider,
		});

		return { success: true, hasSubscription };
	} catch (error) {
		console.error("Error checking subscription:", error);
		return {
			success: false,
			hasSubscription: false,
			message: "Failed to check subscription status",
		};
	}
}

/**
 * Server action to get all products a user has purchased
 */
export async function getUserPurchasedProducts(provider?: "lemonsqueezy" | "polar"): Promise<{
	success: boolean;
	products: any[];
	message?: string;
}> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, products: [], message: "Not authenticated" };
		}

		const products = await PaymentService.getUserPurchasedProducts(session.user.id, provider);

		return { success: true, products };
	} catch (error) {
		console.error("Error getting purchased products:", error);
		return {
			success: false,
			products: [],
			message: "Failed to get purchased products",
		};
	}
}

/**
 * Server action to generate a Polar checkout URL
 */
export async function createPolarCheckoutUrl(
	productId: string,
	metadata?: {
		userId?: string;
		userEmail?: string;
		userName?: string;
		[key: string]: any;
	}
): Promise<{ success: boolean; url?: string; message?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, message: "Not authenticated" };
		}

		const { createCheckoutUrl } = await import("@/lib/polar");

		// Extract user details and handle null values
		const email = session.user.email ?? undefined;
		const name = session.user.name ?? undefined;

		const url = await createCheckoutUrl({
			productId,
			email,
			userId: session.user.id,
			metadata: {
				userId: session.user.id,
				userEmail: email,
				userName: name,
				...metadata,
			},
		});

		if (!url) {
			return {
				success: false,
				message: "Failed to generate checkout URL",
			};
		}

		return { success: true, url };
	} catch (error) {
		console.error("Error creating Polar checkout URL:", error);
		return {
			success: false,
			message: "Failed to generate checkout URL",
		};
	}
}

/**
 * Server action to import payments from a specific provider or all providers
 * @param provider - The payment provider to import from (or "all" for all providers)
 * @returns Stats about the import process
 */
export async function importPayments(
	provider: ImportProvider
): Promise<ImportStats | Record<string, any>> {
	// Declare userId outside the try block to make it available in catch
	let userId: string | undefined;
	try {
		// Get auth session and verify the user is admin
		const session = await auth();

		if (!session?.user) {
			redirect(routes.auth.signIn);
		}

		// Assign userId here
		userId = session.user.id;
		const { email } = session.user;

		// Check if the database is initialized
		if (!db) {
			logger.error("Database not initialized");
			throw new Error("Database not initialized");
		}

		// Check if user is admin by querying the database directly
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				role: true,
			},
		});

		if (!user || !(await isAdmin({ email }))) {
			logger.warn("Unauthorized payment import attempt", {
				userId,
				role: user?.role,
				user,
			});
			throw new Error("Unauthorized: Only admins can import payments");
		}

		// Apply rate limiting with longer duration for imports
		const importRateLimit = {
			requests: 2, // Only 2 import requests
			duration: 60 * 60, // per hour (increased from 30 minutes)
		};
		await rateLimitService.checkLimit(userId, "importPayments", importRateLimit);

		logger.info(`Starting payment import for provider: ${provider}`, { userId });

		// Add overall timeout for the import process
		const importPromise = async () => {
			// Handle import based on the provider argument
			if (provider === "all") {
				// Import from all enabled providers
				// This returns Record<string, any>
				const result = await PaymentService.importAllPayments();

				// Revalidate the admin users page to reflect the new imported data
				revalidatePath("/admin/users");

				return result;
			}

			// If not 'all', import from the specific provider
			const specificProvider = getProvider(provider);

			if (!specificProvider) {
				throw new Error(`Provider "${provider}" not found.`);
			}

			if (!specificProvider.isEnabled) {
				throw new Error(`Provider "${provider}" is not enabled.`);
			}

			// Call the specific provider's import method
			// This returns ImportStats
			const stats: ImportStats = await specificProvider.importPayments();

			// Revalidate the admin users page to reflect the new imported data
			revalidatePath("/admin/users");

			return stats;
		};

		// Set up timeout for the entire import process
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(
				() => {
					reject(new Error(`Import timeout after 10 minutes for provider: ${provider}`));
				},
				10 * 60 * 1000
			); // 10 minutes timeout
		});

		const result = await Promise.race([importPromise(), timeoutPromise]);

		logger.info(`Payment import completed for provider: ${provider}`, {
			userId,
			provider,
			result: typeof result === "object" ? Object.keys(result) : result,
		});

		return result;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error("Error importing payments", {
			userId, // Now accessible here
			provider,
			error: errorMessage,
		});

		// Don't expose detailed error messages to the client for security
		if (errorMessage.includes("Unauthorized")) {
			throw new Error("Unauthorized access");
		}
		if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
			throw new Error("Import process timed out. Please try again later.");
		}
		if (errorMessage.includes("rate limit") || errorMessage.includes("Rate limit")) {
			throw new Error("Rate limit exceeded. Please wait before trying again.");
		}

		// Re-throw the error so the client knows the operation failed
		throw new Error("Import failed. Please try again later.");
	}
}

/**
 * Server action to check Polar subscription status in detail for debugging
 */
export async function debugPolarSubscription(): Promise<{
	success: boolean;
	details: any;
	message?: string;
}> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, details: null, message: "Not authenticated" };
		}

		// Import required modules
		const polarModule = await import("@/lib/polar");
		const hasUserActivePolarSubscription = polarModule.hasUserActiveSubscription;
		const getOrdersByEmail = polarModule.getOrdersByEmail;
		const { db } = await import("@/server/db");
		const { users } = await import("@/server/db/schema");
		const { eq } = await import("drizzle-orm");

		// Get user email
		const user = await db?.query.users.findFirst({
			where: eq(users.id, session.user.id),
			columns: {
				email: true,
			},
		});

		if (!user?.email) {
			return { success: false, details: null, message: "User email not found" };
		}

		// Check subscription status
		const hasSubscription = await hasUserActivePolarSubscription(session.user.id);

		// Get user orders
		const orders = await getOrdersByEmail(user.email);

		// Prepare detailed response
		const details = {
			userId: session.user.id,
			email: user.email,
			hasActiveSubscription: hasSubscription,
			ordersCount: orders.length,
			orders: orders.map((order) => ({
				id: order.id,
				status: order.status,
				amount: order.amount,
				productName: order.productName,
				purchaseDate: order.purchaseDate,
				isSubscription:
					order.attributes?.isSubscription ||
					order.attributes?.is_recurring ||
					order.attributes?.subscription_status === "active",
				subscriptionStatus: order.attributes?.subscription_status,
				subscriptionEndDate: order.attributes?.subscription_end_date || order.attributes?.expiresAt,
			})),
		};

		return { success: true, details };
	} catch (error) {
		console.error("Error checking Polar subscription details:", error);
		return {
			success: false,
			details: { error: String(error) },
			message: "Failed to check Polar subscription details",
		};
	}
}

/**
 * Server action to delete all payments from the database
 * @returns Result of the delete operation
 */
export async function deleteAllPayments(): Promise<{
	success: boolean;
	deletedCount: number;
	message?: string;
}> {
	let userId: string | undefined;
	try {
		// Get auth session and verify the user is admin
		const sessionOrResponse = await auth();

		// If it's a redirect response, return error response
		if (!sessionOrResponse) {
			return {
				success: false,
				deletedCount: 0,
				message: "Authentication required",
			};
		}

		const session = sessionOrResponse;

		if (!session?.user) {
			return {
				success: false,
				deletedCount: 0,
				message: "User not found",
			};
		}

		userId = session.user.id;
		const { email } = session.user;

		// Check if the database is initialized
		if (!db) {
			logger.error("Database not initialized");
			throw new Error("Database not initialized");
		}

		// Check if user is admin by querying the database directly
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				role: true,
			},
		});

		if (!user || !isAdmin({ email })) {
			logger.warn("Unauthorized payment deletion attempt", {
				userId,
				role: user?.role,
				user,
			});
			throw new Error("Unauthorized: Only admins can delete payments");
		}

		// Apply rate limiting
		await rateLimitService.checkLimit(userId, "importPayments", rateLimits.importPayments);

		logger.info("Starting deletion of all payments", { userId });

		// Get count of payments before deletion
		const paymentsBefore = await db.select().from(payments);
		const countBefore = paymentsBefore.length;

		// Delete all payments
		await db.delete(payments);

		logger.info("All payments deleted successfully", {
			userId,
			deletedCount: countBefore,
		});

		// Revalidate the admin payments and users pages
		revalidatePath("/admin/payments");
		revalidatePath("/admin/users");

		return {
			success: true,
			deletedCount: countBefore,
			message: `Successfully deleted ${countBefore} payments`,
		};
	} catch (error) {
		logger.error("Error deleting payments", {
			userId,
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
}

/**
 * Server action to refresh all payments by re-importing from all providers
 * This deletes existing payments and imports fresh data
 * @returns Stats about the refresh process
 */
export async function refreshAllPayments(): Promise<{
	success: boolean;
	deletedCount: number;
	importResults: Record<string, any>;
	message?: string;
}> {
	let userId: string | undefined;
	try {
		// Get auth session and verify the user is admin
		const sessionOrResponse = await auth();

		// If it's a redirect response, return error response
		if (!sessionOrResponse) {
			return {
				success: false,
				deletedCount: 0,
				importResults: {},
				message: "Authentication required",
			};
		}

		const session = sessionOrResponse;

		if (!session?.user) {
			return {
				success: false,
				deletedCount: 0,
				importResults: {},
				message: "User not found",
			};
		}

		userId = session.user.id;
		const { email } = session.user;

		// Check if the database is initialized
		if (!db) {
			logger.error("Database not initialized");
			throw new Error("Database not initialized");
		}

		// Check if user is admin by querying the database directly
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				role: true,
			},
		});

		if (!user || !isAdmin({ email })) {
			logger.warn("Unauthorized payment refresh attempt", {
				userId,
				role: user?.role,
				user,
			});
			throw new Error("Unauthorized: Only admins can refresh payments");
		}

		// Apply rate limiting
		await rateLimitService.checkLimit(userId, "importPayments", rateLimits.importPayments);

		logger.info("Starting refresh of all payments", { userId });

		// First, delete all existing payments
		const paymentsBefore = await db.select().from(payments);
		const deletedCount = paymentsBefore.length;
		await db.delete(payments);

		logger.info("Existing payments deleted", { deletedCount });

		// Then, import fresh data from all providers
		const importResults = await PaymentService.importAllPayments();

		logger.info("Payment refresh completed", {
			userId,
			deletedCount,
			importResults,
		});

		// Revalidate the admin payments and users pages
		revalidatePath("/admin/payments");
		revalidatePath("/admin/users");

		return {
			success: true,
			deletedCount,
			importResults,
			message: `Successfully refreshed payments: deleted ${deletedCount} old payments and imported fresh data`,
		};
	} catch (error) {
		logger.error("Error refreshing payments", {
			userId,
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
}

export async function createPayment(data: {
	provider: "stripe" | "lemonsqueezy" | "polar";
	email?: string;
	productId?: string;
	variantId?: string;
	productName?: string;
	amount?: number;
}): Promise<{ success: boolean; error?: string; url?: string }> {
	try {
		const sessionOrResponse = await auth();

		// If it's a redirect response, redirect
		if (!sessionOrResponse) {
			redirect(routes.auth.signIn);
		}

		const session = sessionOrResponse;

		// Check if user is authenticated
		if (!session?.user?.id) {
			return { success: false, error: "Unauthorized" };
		}

		const userId = session.user.id;
		await rateLimitService.checkLimit(userId, "createPayment", rateLimits.createPayment);

		switch (data.provider) {
			case "stripe":
				// TODO: Implement stripe payment creation
				return { success: false, error: "Stripe payment creation not implemented yet" };
			case "lemonsqueezy":
				// Need proper data format for createLemonSqueezyPayment
				return { success: false, error: "LemonSqueezy payment creation requires webhook data" };
			case "polar":
				// Use createPolarCheckoutUrl instead
				if (data.productId) {
					const result = await createPolarCheckoutUrl(data.productId, {
						userId,
						userEmail: data.email,
					});
					return result;
				}
				return { success: false, error: "Product ID required for Polar checkout" };
			default:
				return { success: false, error: "Invalid provider" };
		}
	} catch (error) {
		console.error("Error creating payment:", error);
		return { success: false, error: "Internal server error" };
	}
}

export async function getPayments() {
	try {
		const sessionOrResponse = await auth();

		// If it's a redirect response, redirect
		if (!sessionOrResponse) {
			redirect(routes.auth.signIn);
		}

		const session = sessionOrResponse;

		// Check if user is authenticated
		if (!session?.user?.id) {
			throw new Error("Unauthorized");
		}

		const userId = session.user.id;
		await rateLimitService.checkLimit(userId, "getPayments", rateLimits.getPayments);

		const userPayments = await db?.query.payments.findMany({
			where: eq(payments.userId, userId),
			orderBy: (payments, { desc }) => [desc(payments.createdAt)],
		});

		return userPayments || [];
	} catch (error) {
		console.error("Error getting payments:", error);
		throw new Error("Failed to get payments");
	}
}

export async function getAllPayments() {
	try {
		const sessionOrResponse = await auth();

		// If it's a redirect response, redirect
		if (!sessionOrResponse) {
			redirect(routes.auth.signIn);
		}

		const session = sessionOrResponse;

		// Check if user is authenticated and is admin
		if (!session?.user?.id) {
			throw new Error("Unauthorized");
		}

		const userId = session.user.id;
		const { email } = session.user;

		// Check if user is admin
		if (!isAdmin({ email })) {
			throw new Error("Unauthorized: Admin access required");
		}

		await rateLimitService.checkLimit(userId, "getAllPayments", rateLimits.getAllPayments);

		const allPayments = await db?.query.payments.findMany({
			orderBy: (payments, { desc }) => [desc(payments.createdAt)],
		});

		return allPayments || [];
	} catch (error) {
		console.error("Error getting all payments:", error);
		throw new Error("Failed to get all payments");
	}
}

export async function importPaymentsFromAllProviders() {
	try {
		const sessionOrResponse = await auth();

		// If it's a redirect response, redirect
		if (!sessionOrResponse) {
			redirect(routes.auth.signIn);
		}

		const session = sessionOrResponse;

		// Check if user is authenticated
		if (!session?.user?.id) {
			throw new Error("Unauthorized");
		}

		const userId = session.user.id;
		const { email } = session.user;

		// Check if user is admin
		if (!isAdmin({ email })) {
			throw new Error("Unauthorized: Admin access required");
		}

		await rateLimitService.checkLimit(userId, "importPayments", rateLimits.importPayments);

		// Import payments from all providers
		const importResults = await PaymentService.importAllPayments();

		return {
			success: true,
			results: importResults,
		};
	} catch (error) {
		console.error("Error importing payments:", error);
		throw new Error("Failed to import payments");
	}
}

export async function getUserPayments(targetUserId?: string) {
	try {
		const sessionOrResponse = await auth();

		// If it's a redirect response, redirect
		if (!sessionOrResponse) {
			redirect(routes.auth.signIn);
		}

		const session = sessionOrResponse;

		// Check if user is authenticated
		if (!session?.user) {
			throw new Error("Unauthorized");
		}

		const currentUserId = session.user.id;
		const { email } = session.user;

		// If no target user ID is provided, use current user
		const userId = targetUserId || currentUserId;

		// If requesting another user's payments, check admin permissions
		if (targetUserId && targetUserId !== currentUserId) {
			if (!isAdmin({ email })) {
				throw new Error("Unauthorized: Admin access required to view other users' payments");
			}
		}

		if (!db) {
			throw new Error("Database not available");
		}

		await rateLimitService.checkLimit(currentUserId, "getPayments", rateLimits.getPayments);

		const userPayments = await db.query.payments.findMany({
			where: eq(payments.userId, userId),
			orderBy: (payments, { desc }) => [desc(payments.createdAt)],
		});

		return userPayments || [];
	} catch (error) {
		console.error("Error getting user payments:", error);
		throw new Error("Failed to get user payments");
	}
}
