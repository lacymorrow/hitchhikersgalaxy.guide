import { db } from "@/server/db";
import { payments, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { PaymentService } from "@/server/services/payment-service";
import { getEnabledProviders } from "@/server/providers";

async function debugPaymentStatus() {
    const email = "lacymorrow0@gmail.com";

    console.log("🔍 Debugging payment status for:", email);
    console.log("=====================================");

    try {
        // 1. Check if user exists in database
        const user = await db?.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            console.log("❌ User not found in database");
            return;
        }

        console.log("✅ User found:", {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
        });

        // 2. Check payments in database
        const userPayments = await db?.query.payments.findMany({
            where: eq(payments.userId, user.id),
            orderBy: (payments, { desc }) => [desc(payments.createdAt)],
        });

        console.log("\n💰 Database payments:", userPayments.length);
        userPayments.forEach((payment, index) => {
            console.log(`  Payment ${index + 1}:`, {
                id: payment.id,
                orderId: payment.orderId,
                processorOrderId: payment.processorOrderId,
                amount: payment.amount,
                status: payment.status,
                processor: payment.processor,
                productName: payment.productName,
                createdAt: payment.createdAt,
            });
        });

        // 3. Check payment status via PaymentService
        const paymentStatus = await PaymentService.getUserPaymentStatus(user.id);
        console.log("\n📊 PaymentService status:", paymentStatus);

        // 4. Check individual providers
        const providers = getEnabledProviders();
        console.log("\n🔌 Enabled providers:", providers.map(p => p.name));

        for (const provider of providers) {
            try {
                const providerStatus = await provider.getPaymentStatus(user.id);
                console.log(`  ${provider.name} status:`, providerStatus);
            } catch (error) {
                console.log(`  ${provider.name} error:`, error.message);
            }
        }

        // 5. Check LemonSqueezy API directly if available
        if (process.env.LEMONSQUEEZY_API_KEY) {
            console.log("\n🍋 Checking LemonSqueezy API directly...");
            try {
                const { listOrders } = await import("@lemonsqueezy/lemonsqueezy.js");
                const orders = await listOrders({});
                const userOrders = orders.data?.data?.filter((order) => {
                    const attributes = order.attributes as any;
                    const customData = attributes.custom_data || {};

                    return (
                        (typeof customData === "object" && customData?.user_id === user.id) ||
                        attributes.user_email?.toLowerCase() === email.toLowerCase()
                    );
                }) ?? [];

                console.log(`  Found ${userOrders.length} orders in LemonSqueezy API`);
                userOrders.forEach((order, index) => {
                    const attributes = order.attributes as any;
                    console.log(`    Order ${index + 1}:`, {
                        id: order.id,
                        identifier: attributes.identifier,
                        user_email: attributes.user_email,
                        status: attributes.status,
                        total: attributes.total,
                        created_at: attributes.created_at,
                        custom_data: attributes.custom_data,
                    });
                });
            } catch (error) {
                console.log("  LemonSqueezy API error:", error.message);
            }
        }

    } catch (error) {
        console.error("❌ Error debugging payment status:", error);
    }
}

// Run the debug function
debugPaymentStatus().then(() => {
    console.log("\n🏁 Debug complete");
    process.exit(0);
}).catch((error) => {
    console.error("❌ Debug failed:", error);
    process.exit(1);
});
