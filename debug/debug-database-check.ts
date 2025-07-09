import { config } from "dotenv";
import { db } from "../src/server/db";
import { payments, users } from "../src/server/db/schema";

// Load environment variables
config();

async function debugDatabaseContent() {
	console.log("🔍 Checking Database Content...");

	// Check if database is initialized
	if (!db) {
		console.error(
			"❌ Database not initialized. Please check your DATABASE_URL environment variable."
		);
		return;
	}

	try {
		// Get all payments from database
		console.log("\n📦 Querying payments table directly...");
		const allPayments = await db.select().from(payments);
		console.log(`Found ${allPayments.length} payments in database`);

		if (allPayments.length > 0) {
			console.log("\n🔍 First 5 payments from database:");
			for (let i = 0; i < Math.min(5, allPayments.length); i++) {
				const payment = allPayments[i];
				console.log(`\nPayment ${i + 1}:`);
				console.log(`  ID: ${payment.id}`);
				console.log(`  Order ID: ${payment.orderId}`);
				console.log(`  Processor Order ID: ${payment.processorOrderId}`);
				console.log(`  User ID: ${payment.userId}`);
				console.log(`  Amount: ${payment.amount}`);
				console.log(`  Processor: ${payment.processor}`);
				console.log(`  Status: ${payment.status}`);
				console.log(`  Is Free Product: ${payment.isFreeProduct}`);

				// Parse and display metadata
				if (payment.metadata) {
					try {
						const metadata = JSON.parse(payment.metadata);
						console.log(`  Metadata:`);
						console.log(
							`    Product Name: "${metadata.productName || metadata.product_name || "N/A"}"`
						);
						console.log(
							`    Variant Name: "${metadata.variantName || metadata.variant_name || "N/A"}"`
						);
						console.log(`    Product ID: "${metadata.productId || metadata.product_id || "N/A"}"`);
						console.log(`    Variant ID: "${metadata.variantId || metadata.variant_id || "N/A"}"`);
						console.log(`    Raw metadata keys: ${Object.keys(metadata).join(", ")}`);
					} catch (error) {
						console.log(`  Metadata: Invalid JSON - ${payment.metadata}`);
					}
				} else {
					console.log(`  Metadata: null/empty`);
				}
			}
		}

		// Get all users to see email mapping
		console.log("\n👥 Querying users table...");
		const allUsers = await db.select().from(users);
		console.log(`Found ${allUsers.length} users in database`);

		if (allUsers.length > 0) {
			console.log("\nFirst 3 users:");
			for (let i = 0; i < Math.min(3, allUsers.length); i++) {
				const user = allUsers[i];
				console.log(`  User ${i + 1}: ${user.email} (ID: ${user.id})`);
			}
		}

		// Check for any payments with "Unknown Product" in metadata
		console.log("\n🔎 Checking for 'Unknown Product' in metadata...");
		const unknownProducts = allPayments.filter((payment) => {
			if (!payment.metadata) return false;
			try {
				const metadata = JSON.parse(payment.metadata);
				const productName = metadata.productName || metadata.product_name || "";
				return productName === "Unknown Product";
			} catch {
				return false;
			}
		});

		console.log(`Found ${unknownProducts.length} payments with "Unknown Product" in metadata`);
	} catch (error) {
		console.error("❌ Error querying database:", error);
	}
}

debugDatabaseContent().catch(console.error);
