import { getPaymentStatus } from "@/lib/lemonsqueezy";
import { logger } from "@/lib/logger";
import { db, isDatabaseInitialized } from "@/server/db";
import { Payment, payments } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// Convert class to object with functions to satisfy linter
const PaymentService = {
	/**
	 * Gets the payment status for a user
	 * @param userId - The ID of the user
	 * @returns Whether the user has paid
	 */
	async getUserPaymentStatus(userId: string): Promise<boolean> {
		logger.debug("Checking payment status", { userId });
		const status = await getPaymentStatus(userId);
		logger.debug("Payment status result", { userId, status });
		return status;
	},

	/**
	 * Gets all payments for a user
	 * @param userId - The ID of the user
	 * @returns Array of payments
	 */
	async getUserPayments(userId: string): Promise<Payment[]> {
		logger.debug("Fetching user payments", { userId });

		if (!isDatabaseInitialized()) {
			logger.error("Database not initialized when fetching user payments", {
				userId,
			});
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		const userPayments = await db?.query.payments.findMany({
			where: eq(payments.userId, userId),
			orderBy: (payments, { desc }) => [desc(payments.createdAt)],
		});

		logger.debug("User payments fetched", {
			userId,
			count: userPayments.length,
			totalAmount: userPayments.reduce(
				(sum: number, p: Payment) => sum + (p.amount || 0),
				0,
			),
		});

		return userPayments;
	},

	/**
	 * Creates a new payment record
	 * @param data - The payment data
	 * @returns The created payment
	 */
	async createPayment(data: {
		userId: string;
		orderId: string;
		amount: number;
		status: string;
		metadata?: Record<string, unknown>;
	}): Promise<Payment> {
		logger.debug("Creating payment record", {
			userId: data.userId,
			orderId: data.orderId,
			amount: data.amount,
			status: data.status,
		});

		if (!isDatabaseInitialized()) {
			logger.error("Database not initialized when creating payment", {
				userId: data.userId,
				orderId: data.orderId,
			});
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		const [payment] = await db
			.insert(payments)
			.values({
				...data,
				metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		if (!payment) {
			logger.error("Failed to create payment record", {
				userId: data.userId,
				orderId: data.orderId,
			});
			throw new Error("Failed to create payment record");
		}

		logger.debug("Payment record created", {
			paymentId: payment.id,
			userId: data.userId,
			orderId: data.orderId,
		});

		return payment;
	},

	/**
	 * Updates a payment's status
	 * @param orderId - The order ID
	 * @param status - The new status
	 * @returns The updated payment
	 */
	async updatePaymentStatus(orderId: string, status: string): Promise<Payment> {
		logger.debug("Updating payment status", { orderId, status });

		if (!isDatabaseInitialized()) {
			logger.error("Database not initialized when updating payment status", {
				orderId,
			});
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		const [payment] = await db
			.update(payments)
			.set({ status, updatedAt: new Date() })
			.where(eq(payments.orderId, orderId))
			.returning();

		if (!payment) {
			logger.error("Payment not found for status update", { orderId, status });
			throw new Error("Payment not found");
		}

		logger.debug("Payment status updated", {
			paymentId: payment.id,
			orderId,
			oldStatus: payment.status,
			newStatus: status,
		});

		return payment;
	},

	/**
	 * Gets a payment by order ID
	 * @param orderId - The order ID
	 * @returns The payment if found
	 */
	async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
		logger.debug("Fetching payment by order ID", { orderId });

		if (!isDatabaseInitialized()) {
			logger.error("Database not initialized when fetching payment", {
				orderId,
			});
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		const payment = await db?.query.payments.findFirst({
			where: eq(payments.orderId, orderId),
		});

		if (payment) {
			logger.debug("Payment found", {
				paymentId: payment.id,
				orderId,
				status: payment.status,
			});
		} else {
			logger.debug("Payment not found", { orderId });
		}

		return payment;
	},
};

export { PaymentService };
