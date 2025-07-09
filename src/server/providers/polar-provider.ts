import { eq } from "drizzle-orm";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import {
	createCheckoutUrl as polarCreateCheckoutUrl,
	fetchPolarProducts as polarFetchProducts,
	getAllOrders as polarGetAllOrders,
	getOrderById as polarGetOrderById,
	getOrdersByEmail as polarGetOrdersByEmail,
	getPolarPaymentStatus as polarGetPaymentStatus,
	getUserPurchasedProducts as polarGetUserPurchasedProducts,
	hasUserActiveSubscription as polarHasUserActiveSubscription,
	hasUserPurchasedProduct as polarHasUserPurchasedProduct,
	processPolarWebhook, // Assuming this exists and handles things
} from "@/lib/polar"; // Import utility functions from the lib
import { db } from "@/server/db"; // For importPayments
import { payments } from "@/server/db/schema"; // For importPayments
import { userService } from "../services/user-service"; // For importPayments
import { BasePaymentProvider } from "./base-provider";
import {
	type CheckoutOptions,
	type ImportStats,
	type OrderData,
	PaymentProviderError,
	type ProductData,
	type ProviderConfig, // Use the standard config type
} from "./types";
// Removed crypto as webhook verification is expected to be handled (or needed) in processPolarWebhook

/**
 * Polar implementation of the PaymentProvider interface
 */
export class PolarProvider extends BasePaymentProvider {
	readonly name = "Polar";
	readonly id = "polar";
	private apiKey?: string;
	private webhookSecret?: string; // Added for potential webhook verification

	/**
	 * Validate the provider configuration
	 */
	protected validateConfig(): void {
		if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
			this._isConfigured = false;
			this._isEnabled = false; // Ensure disabled if feature flag is off
			logger.debug("Polar feature flag disabled, provider not configured.");
			return;
		}

		// Use config passed during initialization first, fallback to env
		this.apiKey = this._config.apiKey || env.POLAR_ACCESS_TOKEN;
		this.webhookSecret = this._config.webhookSecret; // Store webhook secret if provided

		if (!this.apiKey) {
			logger.warn("Polar API key not provided in config or environment variables.");
			this._isConfigured = false;
			return;
		}

		// The actual Polar client initialization seems handled within each function in src/lib/polar.ts
		// We just need to confirm the API key is present.
		this._isConfigured = true;
		logger.debug("Polar provider configured successfully (API key present).");
	}

	/**
	 * Get the payment status for a user
	 */
	async getPaymentStatus(userId: string): Promise<boolean> {
		try {
			this.checkProviderReady(); // Use base class check
			return await polarGetPaymentStatus(userId);
		} catch (error) {
			// Allow 'provider not configured' errors to return false gracefully
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return false;
			}
			return this.handleError(error, "Error checking Polar payment status");
		}
	}

	/**
	 * Check if a user has purchased a specific product
	 */
	async hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
		try {
			this.checkProviderReady();
			return await polarHasUserPurchasedProduct(userId, productId);
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return false;
			}
			return this.handleError(error, "Error checking Polar product purchase");
		}
	}

	/**
	 * Check if a user has an active subscription
	 */
	async hasUserActiveSubscription(userId: string): Promise<boolean> {
		try {
			this.checkProviderReady();
			return await polarHasUserActiveSubscription(userId);
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return false;
			}
			return this.handleError(error, "Error checking Polar subscription status");
		}
	}

	/**
	 * Get all products a user has purchased
	 */
	async getUserPurchasedProducts(userId: string): Promise<ProductData[]> {
		try {
			this.checkProviderReady();
			const polarProducts = await polarGetUserPurchasedProducts(userId);
			// Map the response from the lib function (which returns any[]) to ProductData
			return polarProducts.map((product: any) => ({
				id: String(product.id), // Ensure ID is string
				name: product.name || "Unknown Product", // Use consistent fallback
				// Assuming price comes back in cents from the lib function; adjust if not
				price: typeof product.price === "number" ? product.price / 100 : undefined,
				provider: this.id,
				isSubscription: product.isSubscription ?? false, // Check if lib provides this hint
				attributes: product, // Include original attributes for flexibility
			}));
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return []; // Return empty array if not configured
			}
			return this.handleError(error, "Error getting Polar purchased products");
		}
	}

	/**
	 * Get all orders from Polar
	 */
	async getAllOrders(): Promise<OrderData[]> {
		try {
			this.checkProviderReady();
			// Delegate to the lib function - assuming it returns the PolarOrder[] structure from lib/polar.ts
			const polarOrders = await polarGetAllOrders();
			// Map PolarOrder to OrderData, adding the provider ID
			return polarOrders.map((order) => ({
				id: order.id,
				orderId: order.orderId,
				userEmail: order.userEmail,
				userName: order.userName,
				amount: order.amount, // Assuming amount is in dollars from lib function
				status: order.status,
				productName: order.productName,
				purchaseDate: order.purchaseDate,
				processor: this.id, // Add processor ID
				discountCode: order.discountCode,
				attributes: order.attributes,
			}));
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return [];
			}
			return this.handleError(error, "Error getting all Polar orders");
		}
	}

	/**
	 * Get orders for a specific email
	 */
	async getOrdersByEmail(email: string): Promise<OrderData[]> {
		try {
			this.checkProviderReady();
			const polarOrders = await polarGetOrdersByEmail(email);
			// Map PolarOrder to OrderData
			return polarOrders.map((order) => ({
				id: order.id,
				orderId: order.orderId,
				userEmail: order.userEmail,
				userName: order.userName,
				amount: order.amount, // Assuming amount is in dollars
				status: order.status,
				productName: order.productName,
				purchaseDate: order.purchaseDate,
				processor: this.id,
				discountCode: order.discountCode,
				attributes: order.attributes,
			}));
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return [];
			}
			return this.handleError(error, "Error getting Polar orders by email");
		}
	}

	/**
	 * Get a single order by ID
	 */
	async getOrderById(orderId: string): Promise<OrderData | null> {
		try {
			this.checkProviderReady();
			const polarOrder = await polarGetOrderById(orderId);
			if (!polarOrder) return null;
			// Map PolarOrder to OrderData
			return {
				id: polarOrder.id,
				orderId: polarOrder.orderId,
				userEmail: polarOrder.userEmail,
				userName: polarOrder.userName,
				amount: polarOrder.amount, // Assuming amount is in dollars
				status: polarOrder.status,
				productName: polarOrder.productName,
				purchaseDate: polarOrder.purchaseDate,
				processor: this.id,
				discountCode: polarOrder.discountCode,
				attributes: polarOrder.attributes,
			};
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return null;
			}
			return this.handleError(error, "Error getting Polar order by ID");
		}
	}

	/**
	 * Import payments from Polar into the local database
	 */
	async importPayments(): Promise<ImportStats> {
		this.checkProviderReady(); // Ensures API key is present and feature enabled
		const stats: ImportStats = { total: 0, imported: 0, skipped: 0, errors: 0, usersCreated: 0 };

		if (!db) {
			logger.error("Database not initialized. Cannot import Polar payments.");
			// Use handleError to throw a standard error
			this.handleError(new Error("Database not initialized"), "Polar import failed");
		}

		try {
			logger.info("Starting Polar payment import...");
			const allPolarOrders = await this.getAllOrders(); // Use the provider's method
			stats.total = allPolarOrders.length;
			logger.info(`Found ${stats.total} total Polar orders to process.`);

			for (const order of allPolarOrders) {
				if (!order.userEmail || order.status !== "paid") {
					logger.debug("Skipping Polar order (no email or not paid)", {
						orderId: order.orderId,
						status: order.status,
					});
					stats.skipped++;
					continue;
				}

				// Use the raw orderId from the provider
				const processorOrderId = order.orderId;

				try {
					// Check if payment already exists by raw processor ID
					const existingPayment = await db.query.payments.findFirst({
						where: eq(payments.processorOrderId, processorOrderId),
						columns: { id: true }, // Only need ID to check existence
					});

					if (existingPayment) {
						logger.debug("Skipping already imported Polar order", { processorOrderId });
						stats.skipped++;
						continue;
					}

					// Find or create user
					const { user, created: userCreated } = await userService.findOrCreateUserByEmail(
						order.userEmail,
						{ name: order.userName } // Pass name if available
					);
					if (userCreated) {
						stats.usersCreated++;
						logger.info("Created new user during Polar import", {
							email: order.userEmail,
							userId: user.id,
						});
					}

					// Create payment record
					await db.insert(payments).values({
						userId: user.id,
						orderId: processorOrderId, // Store order ID for compatibility
						amount: Math.round(order.amount * 100), // Store amount in cents
						status: "completed", // Map 'paid' status to 'completed'
						processor: this.id,
						processorOrderId: processorOrderId, // Store the raw Polar order ID
						productName: order.productName, // Store the extracted product name
						metadata: JSON.stringify(order.attributes || {}), // Store original attributes
						purchasedAt: order.purchaseDate,
					});

					logger.info("Successfully imported Polar order", {
						processorOrderId,
						userId: user.id,
						productName: order.productName,
						amount: order.amount,
					});
					stats.imported++;

					// Optional: Update user metadata here if needed, similar to LemonSqueezyProvider
					// await userService.updateUserMetadata(user.id, { ... });
				} catch (innerError: any) {
					logger.error("Error importing single Polar order", {
						orderId: order.orderId,
						email: order.userEmail,
						error: innerError?.message || innerError,
					});
					stats.errors++;
				}
			}
		} catch (error) {
			// Log the error caught by the outer try-catch and rethrow using handleError
			logger.error("Critical error during Polar payment import process", { error });
			return this.handleError(error, "Failed during Polar payment import process");
		}

		logger.info("Polar payment import finished", stats);
		return stats;
	}

	/**
	 * Handle incoming webhook events from Polar
	 */
	async handleWebhookEvent(event: any): Promise<void> {
		try {
			this.checkProviderReady(); // Ensures provider is configured/enabled

			// --- Webhook Signature Verification (Placeholder) ---
			// IMPORTANT: Add actual Polar webhook signature verification here using this.webhookSecret
			// const signature = headers.get('polar-signature'); // Or however Polar sends it
			// const isValid = verifyPolarSignature(JSON.stringify(event), signature, this.webhookSecret);
			// if (!isValid) {
			//   logger.error("Invalid Polar webhook signature");
			//   throw new PaymentProviderError("Invalid webhook signature", this.id, "invalid_signature");
			// }
			// --- End Placeholder ---

			// Delegate processing to the lib function
			// NOTE: processPolarWebhook in lib/polar.ts currently only logs.
			// Real processing (DB updates) needs implementation either here or in the lib function.
			await processPolarWebhook(event);
			logger.info("Processed Polar webhook event via lib function", { type: event?.type });

			// --- Direct DB Update Example (if not handled in lib) ---
			// switch (event?.type) {
			//   case 'checkout.session.completed':
			//   case 'payment_intent.succeeded': // Example event types
			//     const orderData = event.data.object; // Adjust based on actual event structure
			//     const userEmail = orderData.customer_details?.email;
			//     const orderId = orderData.id; // Or relevant ID
			//     const amount = orderData.amount_total; // In cents
			//     const productName = orderData.metadata?.product_name || 'Unknown Product';
			//     const purchaseDate = new Date(orderData.created * 1000);
			//     const userId = orderData.metadata?.user_id; // Assuming you pass this in checkout
			//
			//     if (userEmail && orderId) {
			//       const user = await userService.findUserByEmail(userEmail);
			//       if (user) {
			//         const standardizedOrderId = this.generateOrderId(this.id, orderId);
			//         // Check if payment exists before inserting
			//         const existingPayment = await db.query.payments.findFirst({ where: eq(payments.processorOrderId, standardizedOrderId) });
			//         if (!existingPayment) {
			//           await db.insert(payments).values({
			//             userId: user.id,
			//             amount: amount,
			//             status: 'completed',
			//             processor: this.id,
			//             processorOrderId: standardizedOrderId,
			//             metadata: JSON.stringify(orderData),
			//             purchasedAt: purchaseDate,
			//           });
			//           logger.info("Created payment record from Polar webhook", { standardizedOrderId, type: event.type });
			//         }
			//       } else {
			//          logger.warn("User not found for Polar webhook event", { email: userEmail, eventType: event.type });
			//       }
			//     }
			//     break;
			//   // Add cases for other relevant events (refunds, subscription updates, etc.)
			//   default:
			//     logger.debug("Unhandled Polar webhook event type", { type: event?.type });
			// }
			// --- End Direct DB Update Example ---
		} catch (error) {
			// Don't re-throw if it's just not configured
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				logger.warn("Received Polar webhook, but provider not configured. Skipping.");
				return;
			}
			this.handleError(error, "Error handling Polar webhook event");
		}
	}

	/**
	 * Create a checkout URL for a Polar product
	 */
	async createCheckoutUrl(options: CheckoutOptions): Promise<string | null> {
		try {
			this.checkProviderReady();
			// Delegate to the lib function
			return await polarCreateCheckoutUrl(options);
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return null;
			}
			return this.handleError(error, "Error creating Polar checkout URL");
		}
	}

	/**
	 * List available products from Polar
	 */
	async listProducts(): Promise<ProductData[]> {
		try {
			this.checkProviderReady();
			const polarProducts = await polarFetchProducts();
			// Map response from lib function (any[]) to ProductData
			return polarProducts.map((product: any) => ({
				id: String(product.id), // Ensure ID is string
				name: product.name || "Unknown Polar Product",
				// Assuming price comes back in cents; adjust if necessary
				price: typeof product.price === "number" ? product.price / 100 : undefined,
				description: product.description,
				// Check common ways Polar might indicate a subscription type
				isSubscription:
					product.type === "subscription" ||
					product.is_subscription === true ||
					!!product.recurring_interval,
				provider: this.id,
				attributes: product, // Include original attributes
			}));
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return [];
			}
			return this.handleError(error, "Error listing Polar products");
		}
	}

	// Note: Removed placeholder private methods (_fetchUserSubscriptions, etc.)
	// as logic is now delegated to imported functions from src/lib/polar.ts
}

// Add singleton export for consistency with LemonSqueezyProvider
export const polarProvider = new PolarProvider();
