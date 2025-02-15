import { env } from "@/env";
import { logger } from "@/lib/logger";
import crypto from "crypto";
// src/config/lemonsqueezy.ts
import { db, isDatabaseInitialized } from "@/server/db";
import type { User } from "@/server/db/schema";
import { type NewPlan, payments, plans, users, webhookEvents } from "@/server/db/schema";
import { type LemonSqueezyOrderAttributes, webhookHasMeta } from "@/types/lemonsqueezy";
import {
	type Variant,
	getProduct,
	lemonSqueezySetup,
	listOrders,
	listProducts,
	listVariants,
} from "@lemonsqueezy/lemonsqueezy.js";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface PaymentData {
	id: string;
	orderId: string;
	userEmail: string;
	userName: string | null;
	amount: number;
	status: "paid" | "refunded" | "pending";
	productName: string;
	purchaseDate: Date;
}

// Configuration
const configureLemonSqueezy = (): void => {
	if (!env?.LEMONSQUEEZY_API_KEY) {
		logger.error("LEMONSQUEEZY_API_KEY is not set in the environment.");
		return;
	}
	lemonSqueezySetup({ apiKey: env.LEMONSQUEEZY_API_KEY });
};

// Initialize on import
configureLemonSqueezy();

/**
 * Fetches orders for a specific email from Lemon Squeezy
 */
export const getOrdersByEmail = async (email: string) => {
	try {
		const response = await listOrders({
			filter: {
				userEmail: email.trim(),
			},
		});

		if (!response) {
			return [];
		}

		return response.data?.data ?? [];
	} catch (error) {
		console.error("Error fetching orders by email:", error);
		return [];
	}
};

/**
 * Fetches all orders from Lemon Squeezy
 */
export const getAllOrders = async () => {
	try {
		const response = await listOrders({});

		if (!response || !Array.isArray(response.data?.data)) {
			return [];
		}

		return response.data.data.map((order) => ({
			id: order.id,
			orderId: order.attributes.identifier,
			userEmail: order.attributes.user_email ?? "Unknown",
			userName: order.attributes.user_name,
			amount: order.attributes.total / 100,
			status: order.attributes.status as "paid" | "refunded" | "pending",
			productName: order.attributes.first_order_item.variant_name ?? "Unknown Product",
			purchaseDate: new Date(order.attributes.created_at),
			attributes: order.attributes,
		}));
	} catch (error) {
		console.error("Error fetching all orders:", error);
		return [];
	}
};

export const getPaymentStatusByEmail = async (email: string): Promise<boolean> => {
	try {
		const orders = await listOrders({
			filter: {
				userEmail: email,
			},
		});

		console.log("getPaymentStatusByEmail", orders.data);

		return orders.data?.data?.some((order) => order.attributes.status === "paid") ?? false;
	} catch (error) {
		console.error("Error checking payment status:", error);
		return false;
	}
};

/**
 * Gets the payment status for a user by checking both their ID and email
 * This ensures we catch payments even if they used a different email
 */
export const getPaymentStatus = async (userId: string): Promise<boolean> => {
	try {
		console.log("getPaymentStatus", userId);
		// Check the payment status in your database first
		const payment = await db?.query.payments.findFirst({
			where: eq(payments.userId, userId),
		});

		if (payment) return true;

		// If not found in the database, get the user
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
		});

		console.log("user", user);

		if (!user?.email) return false;

		// Check Lemon Squeezy orders by both user ID and email
		const orders = await listOrders({});
		const userOrders =
			orders.data?.data?.filter((order) => {
				const attributes = order.attributes as LemonSqueezyOrderAttributes;
				const customData = attributes.custom_data || {};

				// Check if either the user ID matches or the email matches
				return (
					// Match by user ID in custom data
					(typeof customData === "object" && customData?.user_id === userId) ||
					// Or match by email (case insensitive)
					attributes.user_email?.toLowerCase() === user.email.toLowerCase()
				);
			}) ?? [];

		const hasPaid = userOrders.some(
			(order) => (order.attributes as LemonSqueezyOrderAttributes).status === "paid"
		);

		// If we found a paid order, store it in our database
		if (hasPaid) {
			const paidOrder = userOrders.find(
				(order) => (order.attributes as LemonSqueezyOrderAttributes).status === "paid"
			);
			if (paidOrder) {
				const attributes = paidOrder.attributes as LemonSqueezyOrderAttributes;
				await db?.insert(payments).values({
					userId,
					orderId: paidOrder.id,
					status: "completed",
					amount: attributes.total,
					metadata: JSON.stringify({
						custom_data: attributes.custom_data || {},
						order_data: attributes,
					}),
				});
			}
		}

		return hasPaid;
	} catch (error) {
		console.error("Error checking payment status:", error);
		return false;
	}
};

// Product-related functions
export const fetchProductVariants = async (productId: string) => {
	const response = await listVariants({
		filter: { productId },
	});

	return response?.data?.data ?? [];
};

export const fetchLemonSqueezyProducts = async () => {
	const response = await listProducts({});
	return response.data ?? [];
};

/**
 * This action will sync the product variants from Lemon Squeezy with the
 * Plans database model.
 */
export const syncPlans = async () => {
	// Fetch all the variants from the database.
	const productVariants: NewPlan[] = await db?.select().from(plans) ?? [];

	// Helper function to add a variant to the productVariants array and sync it with the database.
	async function _addVariant(variant: NewPlan) {
		// Sync the variant with the plan in the database.
		await db
			?.insert(plans)
			.values(variant)
			.onConflictDoUpdate({ target: plans.variantId, set: variant });

		productVariants.push(variant);
	}

	// Fetch products from the Lemon Squeezy store.
	const products = await listProducts({
		filter: { storeId: process.env.LEMONSQUEEZY_STORE_ID },
		include: ["variants"],
	});

	// Loop through all the variants.
	const allVariants = products.data?.included as Variant["data"][] | undefined;

	if (allVariants) {
		for (const v of allVariants) {
			const variant = v.attributes;

			// Skip draft variants
			if (variant.status === "draft") {
				continue;
			}

			// Fetch the Product name.
			const productName = (await getProduct(variant.product_id)).data?.data.attributes.name ?? "";

			const priceString = variant.price?.toString() ?? "";

			await _addVariant({
				name: variant.name,
				description: variant.description,
				price: priceString,
				productId: variant.product_id,
				productName,
				variantId: Number.parseInt(v.id),
				sort: variant.sort,
			});
		}
	}

	revalidatePath("/");

	return productVariants;
};

/**
 * This action will store a webhook event in the database.
 * @param eventName - The name of the event.
 * @param body - The body of the event.
 */
export async function storeWebhookEvent(eventName: string, body: any) {
	const id = crypto.randomInt(100000000, 1000000000);

	const returnedValue = await db
		?.insert(webhookEvents)
		.values({
			id,
			eventName,
			processed: false,
			body,
		})
		.onConflictDoNothing({ target: webhookEvents.id })
		.returning();

	return returnedValue?.[0];
}

/**
 * This action will process a webhook event in the database.
 */
export async function processWebhookEvent(webhookEvent: any) {
	const dbwebhookEvent = await db
		?.select()
		.from(webhookEvents)
		.where(eq(webhookEvents.id, webhookEvent.id));

	if (dbwebhookEvent?.length && dbwebhookEvent.length < 1) {
		throw new Error(`Webhook event #${webhookEvent.id} not found in the database.`);
	}

	const eventBody = webhookEvent.body;

	if (webhookHasMeta(eventBody)) {
		// Handle events related to product variants
		if (webhookEvent.eventName.startsWith("variant_")) {
			// Implement logic for handling variant events
		}

		// Update the webhook event in the database.
		await db
			?.update(webhookEvents)
			.set({
				processed: true,
			})
			.where(eq(webhookEvents.id, webhookEvent.id));
	}
}

interface LemonSqueezyOrder {
	id: string;
	orderId: string;
	attributes: {
		user_email: string | null;
		status: string;
	};
	amount: number;
	status: "paid" | "refunded" | "pending";
	productName: string;
	purchaseDate: Date;
}

/**
 * Fetches all users with their payment status from both the database and Lemon Squeezy
 * This is used in the admin dashboard to display user payment information
 */
export const getUsersWithPayments = async () => {
	try {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		// Get all users from the database
		const allUsers = await db?.query.users.findMany();
		if (!allUsers?.length) return [];

		// Get all payments from the database
		const dbPayments = await db?.query.payments.findMany();

		// Get all orders from Lemon Squeezy (with error handling)
		let lemonSqueezyOrders: LemonSqueezyOrder[] = [];
		try {
			lemonSqueezyOrders = await getAllOrders();
		} catch (error) {
			console.error("Error fetching Lemon Squeezy orders:", error);
		}

		// Map users to include their payment status
		const usersWithPayments = await Promise.all(
			allUsers.map(async (user: User) => {
				if (!user?.email) return null;

				// Check if user has a payment record in our database
				const dbPayment = dbPayments?.find((p) => p.userId === user.id);

				// Check if user has any orders in Lemon Squeezy
				const userOrders = lemonSqueezyOrders.filter(
					(order) => order.attributes.user_email?.toLowerCase() === user.email.toLowerCase()
				);

				const hasPaid =
					dbPayment !== undefined || userOrders.some((order) => order.attributes.status === "paid");

				// Get the last purchase date
				const sortedOrders = [...userOrders].sort(
					(a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime()
				);
				const lastPurchaseDate = sortedOrders[0]?.purchaseDate ?? null;

				// Map orders to Purchase type
				const purchases = userOrders.map((order) => ({
					id: order.id,
					orderId: order.orderId,
					amount: order.amount,
					status: order.status,
					productName: order.productName,
					purchaseDate: order.purchaseDate,
				}));

				return {
					id: user.id,
					name: user.name ?? null,
					email: user.email,
					createdAt: user.createdAt ?? new Date(),
					hasPaid,
					lastPurchaseDate,
					totalPurchases: userOrders.length,
					purchases,
				};
			})
		);

		// Filter out null values and return
		return usersWithPayments.filter(Boolean);
	} catch (error) {
		console.error("Error fetching users with payments:", error);
		return [];
	}
};

/**
 * Fetches all payments with associated user data from both the database and Lemon Squeezy
 * This is used in the admin dashboard to display payment information
 */
export const getPaymentsWithUsers = async () => {
	try {
		// Get all users from the database for mapping
		const allUsers = await db?.query.users.findMany();
		console.log("allUsers", allUsers);

		// Get all orders from Lemon Squeezy
		const lemonSqueezyOrders = await getAllOrders();
		console.log("lemonSqueezyOrders", lemonSqueezyOrders);

		// Map orders to PaymentData type
		const payments: PaymentData[] = lemonSqueezyOrders.map((order) => ({
			id: order.id,
			orderId: order.orderId,
			userEmail: order.userEmail,
			userName: order.userName,
			amount: order.amount,
			status: order.status,
			productName: order.productName,
			purchaseDate: order.purchaseDate,
		}));

		// Sort by purchase date, most recent first
		return payments.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime());
	} catch (error) {
		logger.error("Error fetching payments with users:", error);
		return [];
	}
};
