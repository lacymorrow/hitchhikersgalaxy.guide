import crypto from "crypto";
// @see https://docs.lemonsqueezy.com/api/webhooks
// @see https://raw.githubusercontent.com/lmsqueezy/nextjs-billing/refs/heads/main/src/app/api/webhook/route.ts
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { PaymentService } from "@/server/services/payment-service";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Verify that the webhook request is coming from Lemon Squeezy
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
	if (!env.LEMONSQUEEZY_WEBHOOK_SECRET) {
		logger.error("Missing LEMONSQUEEZY_WEBHOOK_SECRET environment variable");
		return false;
	}

	const hmac = crypto.createHmac("sha256", env.LEMONSQUEEZY_WEBHOOK_SECRET);
	const digest = hmac.update(payload).digest("hex");
	const isValid = crypto.timingSafeEqual(
		Buffer.from(signature),
		Buffer.from(digest),
	);

	if (!isValid) {
		logger.warn("Invalid webhook signature", {
			expectedSignature: digest,
			receivedSignature: signature,
		});
	}

	return isValid;
}

export async function POST(request: Request) {
	const startTime = Date.now();
	console.log("Webhook request received");

	try {
		// Get the signature from the headers
		const headersList = await headers();
		// const signature = headersList.get("x-signature");
		// if (!signature) {
		// 	logger.warn("Missing signature in webhook request", {
		// 		headers: Object.fromEntries(headersList.entries()),
		// 	});
		// 	return new NextResponse("Missing signature", { status: 401 });
		// }

		// Get the raw body
		const body = await request.text();
		console.log("Raw webhook body:", body);

		// Parse the webhook data
		const webhookData = JSON.parse(body);
		const { data, meta } = webhookData;

		console.log("Processing webhook event", {
			eventName: meta.event_name,
			orderId: data.id,
			customData: meta.custom_data,
			testMode: meta.test_mode,
			productName: data.attributes?.first_order_item?.product_name,
			orderStatus: data.attributes?.status,
			orderTotal: data.attributes?.total_usd || data.attributes?.total,
		});

		// Handle different webhook events
		switch (meta.event_name) {
			case "order_created": {
				const { attributes } = data;
				// For now, use the user's email if no user_id is provided
				const userId = meta.custom_data?.user_id || attributes.user_email;

				if (!userId) {
					console.error("No user ID or email found in order data", {
						orderId: data.id,
						customData: meta.custom_data,
					});
					return new NextResponse("No user identifier found", { status: 400 });
				}

				console.log("Creating payment record", {
					userId,
					orderId: data.id,
					status: attributes.status,
					amount: attributes.total_usd || attributes.total,
					productName: attributes.first_order_item?.product_name,
					variantName: attributes.first_order_item?.variant_name,
				});

				// Store the payment in our database
				const payment = await PaymentService.createPayment({
					userId,
					orderId: data.id,
					status: attributes.status,
					amount: attributes.total_usd || attributes.total,
					metadata: {
						custom_data: meta.custom_data,
						order_data: attributes,
						test_mode: meta.test_mode,
					},
				});

				console.log("Payment record created successfully", {
					paymentId: payment.id,
					userId,
					orderId: data.id,
					amount: attributes.total_usd || attributes.total,
					processingTime: Date.now() - startTime,
				});

				break;
			}

			case "order_refunded": {
				const orderId = data.id;
				const { attributes } = data;

				console.log("Processing refund", {
					orderId,
					refundAmount: attributes.refunded_amount,
					refundedAt: attributes.refunded_at,
				});

				// Update payment status in our database
				const payment = await PaymentService.updatePaymentStatus(
					orderId,
					"refunded",
				);

				console.log("Payment refunded successfully", {
					paymentId: payment.id,
					orderId,
					processingTime: Date.now() - startTime,
				});
				break;
			}

			default: {
				console.info("Unhandled webhook event", {
					eventName: meta.event_name,
					orderId: data.id,
				});
			}
		}

		console.log("Webhook processed successfully", {
			eventName: meta.event_name,
			orderId: data.id,
			processingTime: Date.now() - startTime,
		});

		return new NextResponse("Webhook processed", { status: 200 });
	} catch (error) {
		console.error("Webhook processing error", {
			error,
			processingTime: Date.now() - startTime,
			...(error instanceof Error && {
				errorName: error.name,
				errorMessage: error.message,
				errorStack: error.stack,
			}),
		});
		return new NextResponse("Webhook error", { status: 500 });
	}
}

export async function GET(request: Request) {
	console.log("GET request received:", {
		url: request.url,
		method: request.method,
		headers: Object.fromEntries(request.headers.entries()),
	});
	return new NextResponse("Method not allowed", { status: 405 });
}
