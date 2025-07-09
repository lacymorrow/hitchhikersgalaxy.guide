#!/usr/bin/env tsx

/**
 * Debug script to test Polar API calls directly
 * Tests product name extraction from real API responses
 * Run with: npx tsx debug-polar-api-test.ts
 */

import { Polar } from "@polar-sh/sdk";
import { env } from "@/env";

// Initialize Polar client
const initializePolarClient = (): Polar | null => {
	if (!env?.POLAR_ACCESS_TOKEN) {
		console.error("❌ POLAR_ACCESS_TOKEN is not set in the environment.");
		return null;
	}

	try {
		const polarClient = new Polar({
			accessToken: env.POLAR_ACCESS_TOKEN,
			server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
		});

		console.log("✅ Polar client initialized successfully");
		return polarClient;
	} catch (error) {
		console.error("❌ Failed to initialize Polar client:", error);
		return null;
	}
};

// Test product name extraction
const testProductNameExtraction = (order: any, orderId: string) => {
	console.log(`\n--- Testing Product Name Extraction for Order: ${orderId} ---`);

	// Apply the same logic as in mapToPolarOrder
	let productName = "Unknown Product";
	let extractionSource = "fallback";

	if (order.product?.name) {
		productName = order.product.name;
		extractionSource = "order.product.name";
	} else if (order.variant?.name) {
		productName = order.variant.name;
		extractionSource = "order.variant.name";
	} else if (order.productName) {
		productName = order.productName;
		extractionSource = "order.productName";
	} else if (order.description) {
		productName = order.description;
		extractionSource = "order.description";
	} else if (order.items && Array.isArray(order.items) && order.items.length > 0) {
		const firstItem = order.items[0];
		if (firstItem.product?.name) {
			productName = firstItem.product.name;
			extractionSource = "order.items[0].product.name";
		} else if (firstItem.variant?.name) {
			productName = firstItem.variant.name;
			extractionSource = "order.items[0].variant.name";
		} else if (firstItem.name) {
			productName = firstItem.name;
			extractionSource = "order.items[0].name";
		}
	}

	console.log(`✅ Product Name: "${productName}"`);
	console.log(`🔍 Extraction Source: ${extractionSource}`);

	// Log available fields for debugging
	console.log("📋 Available Fields:");
	console.log(`   - order.product?.name: ${order.product?.name || "null"}`);
	console.log(`   - order.variant?.name: ${order.variant?.name || "null"}`);
	console.log(`   - order.productName: ${order.productName || "null"}`);
	console.log(`   - order.description: ${order.description || "null"}`);
	console.log(`   - order.items: ${order.items ? `Array(${order.items.length})` : "null"}`);

	if (order.items && Array.isArray(order.items) && order.items.length > 0) {
		const firstItem = order.items[0];
		console.log(`   - order.items[0].product?.name: ${firstItem.product?.name || "null"}`);
		console.log(`   - order.items[0].variant?.name: ${firstItem.variant?.name || "null"}`);
		console.log(`   - order.items[0].name: ${firstItem.name || "null"}`);
	}

	return { productName, extractionSource };
};

// Extract orders from response
const extractOrdersFromResponse = (response: any): any[] => {
	if (!response) return [];

	if (Array.isArray(response)) {
		return response;
	}

	if (response.items && Array.isArray(response.items)) {
		return response.items;
	}

	if (response.data?.items && Array.isArray(response.data.items)) {
		return response.data.items;
	}

	if (response.result?.items && Array.isArray(response.result.items)) {
		return response.result.items;
	}

	console.log("⚠️  Unknown response format:", Object.keys(response));
	return [];
};

// Main test function
async function testPolarApi() {
	console.log("🧪 Testing Polar API Product Name Extraction");
	console.log("=".repeat(50));

	const polarClient = initializePolarClient();
	if (!polarClient) {
		process.exit(1);
	}

	try {
		// Test 1: Fetch orders with expanded product information
		console.log("\n📡 Test 1: Fetching orders with expanded product information...");

		const response = await polarClient.orders.list({
			include: ["product", "product.variants", "items", "items.product", "items.variant"],
		} as any);

		console.log("✅ API Response received");
		console.log(`📊 Response type: ${Array.isArray(response) ? "Array" : typeof response}`);
		console.log(`📊 Response keys: ${Object.keys(response)}`);

		// Extract orders
		const orders = extractOrdersFromResponse(response);
		console.log(`📊 Orders found: ${orders.length}`);

		if (orders.length === 0) {
			console.log("⚠️  No orders found. This might be expected if no orders exist.");
			return;
		}

		// Test product name extraction for each order
		console.log("\n🔍 Testing product name extraction:");
		const results: any[] = [];

		for (let i = 0; i < Math.min(orders.length, 5); i++) {
			const order = orders[i];
			const orderId = order.id || `order-${i}`;
			const result = testProductNameExtraction(order, orderId);
			results.push({
				orderId,
				...result,
				status: order.status,
				amount: order.amount,
				userEmail: order.customer?.email || order.email,
			});
		}

		// Summary
		console.log("\n📈 SUMMARY");
		console.log("=".repeat(30));
		console.log(`Total orders tested: ${results.length}`);

		const extractionSources = results.reduce((acc: any, result) => {
			acc[result.extractionSource] = (acc[result.extractionSource] || 0) + 1;
			return acc;
		}, {});

		console.log("Extraction sources:");
		Object.entries(extractionSources).forEach(([source, count]) => {
			console.log(`  ${source}: ${count}`);
		});

		const unknownProducts = results.filter((r) => r.productName === "Unknown Product");
		console.log(`Unknown products: ${unknownProducts.length}/${results.length}`);

		if (unknownProducts.length > 0) {
			console.log("\n⚠️  Orders with unknown products:");
			unknownProducts.forEach((result) => {
				console.log(`  - Order ${result.orderId}: ${result.productName}`);
			});
		}

		// Test 2: Fetch a single order by ID (if available)
		if (results.length > 0) {
			const firstOrderId = results[0].orderId;
			console.log(`\n📡 Test 2: Fetching single order by ID: ${firstOrderId}`);

			try {
				const singleOrderResponse = await polarClient.orders.get(firstOrderId, {
					include: ["product", "product.variants", "items", "items.product", "items.variant"],
				} as any);

				console.log("✅ Single order fetched successfully");
				testProductNameExtraction(singleOrderResponse, firstOrderId);
			} catch (error) {
				console.log(
					"⚠️  Could not fetch single order:",
					error instanceof Error ? error.message : String(error)
				);
			}
		}
	} catch (error) {
		console.error("❌ Error testing Polar API:", error);
		if (error instanceof Error) {
			console.error("Stack trace:", error.stack);
		}
		process.exit(1);
	}

	console.log("\n✅ Polar API test completed!");
}

// Run the test
if (require.main === module) {
	testPolarApi()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("Fatal error:", error);
			process.exit(1);
		});
}

export { testPolarApi };
