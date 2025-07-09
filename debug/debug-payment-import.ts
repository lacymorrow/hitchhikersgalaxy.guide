import { config } from "dotenv";
import { PaymentService } from "../src/server/services/payment-service.js";

// Load environment variables
config();

async function debugPaymentImport() {
	console.log("🚀 Starting Payment Import Debug...");

	// Show environment status
	console.log("\n🔧 Environment Status:");
	console.log(
		`  LEMONSQUEEZY_API_KEY: ${process.env.LEMONSQUEEZY_API_KEY ? "✅ Set" : "❌ Not set"}`
	);
	console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? "✅ Set" : "❌ Not set"}`);

	try {
		console.log("\n📦 Test 1: Getting payments with users (admin display)");
		const payments = await PaymentService.getPaymentsWithUsers();
		console.log(`✅ Found ${payments.length} payments`);

		console.log("\n🔍 First 3 payments:");
		for (let i = 0; i < Math.min(3, payments.length); i++) {
			const payment = payments[i];
			console.log(`Payment ${i + 1}:`);
			console.log(`  Order ID: ${payment.orderId}`);
			console.log(`  Product Name: "${payment.productName}"`);
			console.log(`  User Email: ${payment.userEmail}`);
			console.log(`  Processor: ${payment.processor}`);
			console.log(`  Is in Database: ${payment.isInDatabase}`);
			console.log(`  Amount: $${payment.amount}`);
		}

		console.log("\n🔄 Test 2: Running import all payments");
		const importResults = await PaymentService.importAllPayments();
		console.log("Import results:", importResults);

		console.log("\n📦 Test 3: Getting payments again after import");
		const paymentsAfterImport = await PaymentService.getPaymentsWithUsers();
		console.log(`✅ Found ${paymentsAfterImport.length} payments after import`);

		console.log("\n🔍 First 3 payments after import:");
		for (let i = 0; i < Math.min(3, paymentsAfterImport.length); i++) {
			const payment = paymentsAfterImport[i];
			console.log(`Payment ${i + 1}:`);
			console.log(`  Order ID: ${payment.orderId}`);
			console.log(`  Product Name: "${payment.productName}"`);
			console.log(`  User Email: ${payment.userEmail}`);
			console.log(`  Processor: ${payment.processor}`);
			console.log(`  Is in Database: ${payment.isInDatabase}`);
			console.log(`  Amount: $${payment.amount}`);
		}

		// Test 4: Check if there are any payments showing "Unknown Product"
		console.log("\n🔎 Test 4: Checking for 'Unknown Product' payments");
		const unknownProducts = paymentsAfterImport.filter((p) => p.productName === "Unknown Product");
		console.log(`Found ${unknownProducts.length} payments with "Unknown Product"`);

		if (unknownProducts.length > 0) {
			console.log("First unknown product payment details:");
			const unknown = unknownProducts[0];
			console.log(`  Order ID: ${unknown.orderId}`);
			console.log(`  Processor: ${unknown.processor}`);
			console.log(`  Is in Database: ${unknown.isInDatabase}`);
			console.log(`  User Email: ${unknown.userEmail}`);
		}
	} catch (error) {
		console.error("❌ Error in payment import debug:", error);
	}
}

debugPaymentImport().catch(console.error);
