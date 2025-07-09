import { config } from "dotenv";
import { PaymentService } from "../src/server/services/payment-service";

// Load environment variables
config();

async function testImportAndCheck() {
	console.log("🚀 Testing Import and Database Check...");

	try {
		console.log("\n📦 Step 1: Import payments from all providers");
		await PaymentService.importAllPayments();

		console.log("\n🔍 Step 2: Check what's now in the database");
		const payments = await PaymentService.getPaymentsWithUsers();
		console.log(`✅ Found ${payments.length} payments in database`);

		console.log("\n📋 Step 3: Show first 3 payment product names");
		for (let i = 0; i < Math.min(3, payments.length); i++) {
			const payment = payments[i];
			console.log(`Payment ${i + 1}:`);
			console.log(`  Order ID: ${payment.orderId}`);
			console.log(`  Product Name: "${payment.productName}"`);
			console.log(`  Processor: ${payment.processor}`);
			console.log(`  Amount: $${payment.amount}`);
			console.log(`  Is in Database: ${payment.isInDatabase}`);
		}

		console.log("\n🔎 Step 4: Check for 'Unknown Product' entries");
		const unknownProducts = payments.filter((p) => p.productName === "Unknown Product");
		console.log(`Found ${unknownProducts.length} payments with "Unknown Product"`);

		if (unknownProducts.length > 0) {
			console.log("Details of first unknown product payment:");
			const unknown = unknownProducts[0];
			console.log(`  Order ID: ${unknown.orderId}`);
			console.log(`  Processor: ${unknown.processor}`);
			console.log(`  User Email: ${unknown.userEmail}`);
		}

		console.log("\n✅ Import and check complete!");
	} catch (error) {
		console.error("❌ Error in test:", error);
	}
}

// Run the test
testImportAndCheck().catch(console.error);
