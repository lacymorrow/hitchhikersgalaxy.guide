#!/usr/bin/env tsx

/**
 * Debug script to test full import process for Polar payments
 * Tests that product names are properly stored in database
 * Run with: npx tsx debug-polar-import-test.ts
 */

import { eq } from "drizzle-orm";
import { env } from "@/env";
import { db } from "@/server/db";
import { payments } from "@/server/db/schema";
import { PolarProvider } from "@/server/providers/polar-provider";

// Test the full import process
async function testPolarImport() {
	console.log("🧪 Testing Polar Import Process");
	console.log("=".repeat(50));

	// Check if database is initialized
	if (!db) {
		console.error(
			"❌ Database not initialized. Please check your DATABASE_URL environment variable."
		);
		return;
	}

	// Initialize the provider
	const provider = new PolarProvider();
	provider.initialize({
		apiKey: env.POLAR_ACCESS_TOKEN,
		enabled: true,
	});

	console.log(`✅ Provider initialized: ${provider.name} (${provider.id})`);
	console.log(`🔧 Provider configured: ${provider.isConfigured}`);
	console.log(`⚡ Provider enabled: ${provider.isEnabled}`);

	if (!provider.isConfigured || !provider.isEnabled) {
		console.log("⚠️  Provider not configured or enabled. Please check environment variables.");
		return;
	}

	try {
		// Test 1: Check current payments in database
		console.log("\n📊 Test 1: Checking existing Polar payments in database...");

		const existingPayments = await db.query.payments.findMany({
			where: eq(payments.processor, "polar"),
			columns: {
				id: true,
				orderId: true,
				productName: true,
				amount: true,
				status: true,
				userId: true,
				createdAt: true,
			},
		});

		console.log(`✅ Existing Polar payments in database: ${existingPayments.length}`);

		if (existingPayments.length > 0) {
			console.log("\n🔍 Existing payments:");
			existingPayments.slice(0, 5).forEach((payment, index) => {
				console.log(`  ${index + 1}. Order: ${payment.orderId}`);
				console.log(`      Product: "${payment.productName}"`);
				console.log(`      Amount: $${payment.amount}`);
				console.log(`      Status: ${payment.status}`);
				console.log(`      Created: ${payment.createdAt?.toISOString()}`);
			});

			// Count unknown products in database
			const unknownInDb = existingPayments.filter((p) => p.productName === "Unknown Product");
			console.log(
				`\n📊 Unknown products in database: ${unknownInDb.length}/${existingPayments.length}`
			);

			if (unknownInDb.length > 0) {
				console.log("\n⚠️  Database payments with unknown products:");
				unknownInDb.forEach((payment) => {
					console.log(`  - Order ${payment.orderId}: "${payment.productName}"`);
				});
			}
		}

		// Test 2: Import fresh payments
		console.log("\n📡 Test 2: Running payment import process...");

		const importStats = await provider.importPayments();
		console.log(`✅ Import completed!`);
		console.log(`📊 Import statistics:`);
		console.log(`  - Total processed: ${importStats.total}`);
		console.log(`  - New payments: ${importStats.imported}`);
		console.log(`  - Skipped payments: ${importStats.skipped}`);
		console.log(`  - Errors: ${importStats.errors}`);

		if (importStats.errors > 0) {
			console.log(`⚠️  Import had ${importStats.errors} errors. Check logs for details.`);
		}

		// Test 3: Check database after import
		console.log("\n📊 Test 3: Checking database after import...");

		const postImportPayments = await db.query.payments.findMany({
			where: eq(payments.processor, "polar"),
			columns: {
				id: true,
				orderId: true,
				productName: true,
				amount: true,
				status: true,
				userId: true,
				createdAt: true,
			},
		});

		console.log(`✅ Post-import Polar payments in database: ${postImportPayments.length}`);

		if (postImportPayments.length > 0) {
			// Check for improvements in product names
			const unknownPostImport = postImportPayments.filter(
				(p) => p.productName === "Unknown Product"
			);
			console.log(
				`📊 Unknown products after import: ${unknownPostImport.length}/${postImportPayments.length}`
			);

			// Compare before and after
			const beforeUnknown = existingPayments.filter(
				(p) => p.productName === "Unknown Product"
			).length;
			const afterUnknown = unknownPostImport.length;

			if (beforeUnknown > afterUnknown) {
				console.log(
					`✅ Improvement! Unknown products reduced from ${beforeUnknown} to ${afterUnknown}`
				);
			} else if (beforeUnknown === afterUnknown && afterUnknown === 0) {
				console.log(`✅ Perfect! No unknown products detected`);
			} else if (beforeUnknown === afterUnknown) {
				console.log(`⚠️  No improvement in product name extraction`);
			} else {
				console.log(`❌ Product name extraction got worse: ${beforeUnknown} -> ${afterUnknown}`);
			}

			// Show newly imported payments
			if (importStats.imported > 0) {
				console.log(`\n🆕 Newly imported payments (last ${Math.min(3, importStats.imported)}):`);
				const newestPayments = postImportPayments
					.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
					.slice(0, 3);

				newestPayments.forEach((payment, index) => {
					console.log(`  ${index + 1}. Order: ${payment.orderId}`);
					console.log(`      Product: "${payment.productName}"`);
					console.log(`      Amount: $${payment.amount}`);
					console.log(`      Status: ${payment.status}`);

					if (payment.productName === "Unknown Product") {
						console.log(`      ⚠️  UNKNOWN PRODUCT IN NEW IMPORT!`);
					}
				});
			}

			// Show product name distribution
			const productNames = postImportPayments.map((p) => p.productName || "null");
			const productCounts = productNames.reduce((acc: any, name) => {
				acc[name] = (acc[name] || 0) + 1;
				return acc;
			}, {});

			console.log(`\n📈 Product name distribution:`);
			Object.entries(productCounts)
				.sort(([, a], [, b]) => (b as number) - (a as number))
				.slice(0, 10)
				.forEach(([name, count]) => {
					const indicator = name === "Unknown Product" ? "❌" : "✅";
					console.log(`  ${indicator} "${name}": ${count}`);
				});
		}

		// Test 4: Compare API data with database data
		console.log("\n🔄 Test 4: Comparing API data with database data...");

		const apiOrders = await provider.getAllOrders();
		console.log(`📡 Orders from API: ${apiOrders.length}`);
		console.log(`🗄️  Payments in database: ${postImportPayments.length}`);

		if (apiOrders.length > 0 && postImportPayments.length > 0) {
			// Check if API data has fewer unknown products than database
			const apiUnknown = apiOrders.filter((o) => o.productName === "Unknown Product").length;
			const dbUnknown = postImportPayments.filter(
				(p) => p.productName === "Unknown Product"
			).length;

			console.log(`📊 Unknown products comparison:`);
			console.log(`  API: ${apiUnknown}/${apiOrders.length}`);
			console.log(`  Database: ${dbUnknown}/${postImportPayments.length}`);

			if (apiUnknown < dbUnknown) {
				console.log(`⚠️  Database has more unknown products than API - import issue detected!`);
			} else if (apiUnknown === dbUnknown && apiUnknown === 0) {
				console.log(`✅ Perfect consistency - no unknown products!`);
			} else {
				console.log(`✅ Good consistency between API and database`);
			}

			// Sample comparison
			if (apiOrders.length > 0) {
				console.log(`\n🔍 Sample API vs Database comparison:`);
				const sampleOrder = apiOrders[0];
				const matchingPayment = postImportPayments.find(
					(p) => p.orderId === sampleOrder.orderId || p.orderId === sampleOrder.id
				);

				console.log(`  API Order: "${sampleOrder.productName}" (${sampleOrder.orderId})`);
				if (matchingPayment) {
					console.log(
						`  DB Payment: "${matchingPayment.productName}" (${matchingPayment.orderId})`
					);
					if (sampleOrder.productName !== matchingPayment.productName) {
						console.log(`  ⚠️  Product name mismatch detected!`);
					}
				} else {
					console.log(`  DB Payment: Not found`);
				}
			}
		}

		// Summary
		console.log("\n📈 IMPORT TEST SUMMARY");
		console.log("=".repeat(40));
		console.log(`Provider: ${provider.name}`);
		console.log(`Import statistics:`);
		console.log(`  - Total processed: ${importStats.total}`);
		console.log(`  - New payments: ${importStats.imported}`);
		console.log(`  - Skipped payments: ${importStats.skipped}`);
		console.log(`  - Errors: ${importStats.errors}`);

		const finalUnknownCount = postImportPayments.filter(
			(p) => p.productName === "Unknown Product"
		).length;
		console.log(`Final unknown products: ${finalUnknownCount}/${postImportPayments.length}`);

		if (finalUnknownCount === 0) {
			console.log(`✅ SUCCESS: All products have proper names!`);
		} else {
			console.log(
				`⚠️  NEEDS IMPROVEMENT: ${finalUnknownCount} products still show as "Unknown Product"`
			);
		}
	} catch (error) {
		console.error("❌ Error testing Polar import:", error);
		if (error instanceof Error) {
			console.error("Stack trace:", error.stack);
		}
		process.exit(1);
	}

	console.log("\n✅ Polar import test completed!");
}

// Run the test
if (require.main === module) {
	testPolarImport()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("Fatal error:", error);
			process.exit(1);
		});
}

export { testPolarImport };
