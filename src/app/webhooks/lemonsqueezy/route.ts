import crypto from "crypto";
// @see https://docs.lemonsqueezy.com/api/webhooks
// @see https://raw.githubusercontent.com/lmsqueezy/nextjs-billing/refs/heads/main/src/app/api/webhook/route.ts
import { storeWebhookEvent } from "@/lib/lemonsqueezy";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { payments, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const signature = request.headers.get("x-signature");
		logger.info("Lemonsqueezy webhook received: ", {
			event: body.meta.event_name,
			custom_data: body.data.attributes.custom_data,
		});

		if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET || !signature) {
			logger.warn("Unauthorized webhook request", { signature });
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const hmac = crypto.createHmac(
			"sha256",
			process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
		);
		const digest = hmac.update(JSON.stringify(body)).digest("hex");

		if (signature !== digest) {
			logger.warn("Invalid signature for webhook", { signature, digest });
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		const event = await storeWebhookEvent(body.meta.event_name, body);

		logger.info("Webhook event stored", {
			eventName: body.meta.event_name,
			eventId: event?.id,
		});

		// Handle the event
		if (body.meta.event_name === "order_created") {
			const customData = body.data.attributes.custom_data || {};
			const userEmail = body.data.attributes.user_email;
			const userId = customData.user_id;

			// Try to find user by ID first, then fall back to email
			const user = await db.query.users.findFirst({
				where: userId ? eq(users.id, userId) : eq(users.email, userEmail),
			});

			if (!user) {
				logger.warn("User not found for order", { userEmail, userId });
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}

			// Create payment record
			await db.insert(payments).values({
				userId: user.id,
				orderId: body.data.id,
				status: "completed",
				amount: body.data.attributes.total,
				metadata: JSON.stringify({
					custom_data: customData,
					order_data: body.data.attributes,
				}),
			});

			logger.info("Payment record created", {
				userId: user.id,
				orderId: body.data.id,
				amount: body.data.attributes.total,
			});
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		logger.error("Webhook error", { error });
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
