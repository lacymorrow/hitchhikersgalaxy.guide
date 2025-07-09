import { lemonSqueezySetup, listOrders } from "@lemonsqueezy/lemonsqueezy.js";
import { env } from "../src/env";

// Setup LemonSqueezy
lemonSqueezySetup({ apiKey: env.LEMONSQUEEZY_API_KEY });

async function debugLemonSqueezyImport() {
	console.log("🚀 Starting LemonSqueezy debug...");

	try {
		// Test 1: Get orders with include parameter
		console.log("\n📦 Test 1: Getting orders with include parameter");
		const response = await listOrders({
			include: ["order-items", "customer"],
		});

		if (!response || !Array.isArray(response.data?.data)) {
			console.log("❌ No orders found or invalid response");
			return;
		}

		const orders = response.data.data;
		console.log(`✅ Found ${orders.length} orders`);

		// Test 2: Examine first order structure
		if (orders.length > 0) {
			const firstOrder = orders[0];
			console.log("\n🔍 Test 2: Examining first order structure");
			console.log("Order ID:", firstOrder.id);
			console.log("Order attributes keys:", Object.keys(firstOrder.attributes));

			// Check if first_order_item exists
			const attributes = firstOrder.attributes as any;
			console.log("\nfirst_order_item exists:", !!attributes.first_order_item);

			if (attributes.first_order_item) {
				console.log("first_order_item structure:", attributes.first_order_item);
				console.log("product_name:", attributes.first_order_item.product_name);
				console.log("variant_name:", attributes.first_order_item.variant_name);
			} else {
				console.log("❌ first_order_item is missing!");
			}
		}

		// Test 3: Test product name extraction
		console.log("\n🏷️ Test 3: Testing product name extraction");
		for (let i = 0; i < Math.min(3, orders.length); i++) {
			const order = orders[i];
			const attributes = order.attributes as any;

			const getProductName = (): string => {
				const orderItem = attributes.first_order_item;

				if (!orderItem) {
					return "Unknown Product";
				}

				const productName = orderItem.product_name;
				const variantName = orderItem.variant_name;

				// Create a meaningful product name based on available information
				if (productName && variantName) {
					// If both exist, check if variant name is just a copy of product name
					if (variantName === productName) {
						return productName;
					}
					// If they're different, show both for clarity
					return `${productName} - ${variantName}`;
				}

				// Fallback to whichever is available
				return variantName || productName || "Unknown Product";
			};

			const extractedName = getProductName();
			console.log(`Order ${i + 1} (${order.id}): "${extractedName}"`);
		}

		// Test 4: Test without include parameter
		console.log("\n📦 Test 4: Getting orders WITHOUT include parameter");
		const responseNoInclude = await listOrders({});

		if (responseNoInclude?.data?.data?.[0]) {
			const firstOrderNoInclude = responseNoInclude.data.data[0];
			const attrsNoInclude = firstOrderNoInclude.attributes as any;
			console.log("Without include - first_order_item exists:", !!attrsNoInclude.first_order_item);

			if (attrsNoInclude.first_order_item) {
				console.log(
					"Without include - product_name:",
					attrsNoInclude.first_order_item.product_name
				);
			}
		}
	} catch (error) {
		console.error("❌ Error in debug:", error);
	}
}

debugLemonSqueezyImport();
