// Set environment variables explicitly
process.env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED = "true";
process.env.LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY || "test-key";

import { env } from "../src/env";
import { getEnabledProviders, initializePaymentProviders } from "../src/server/providers";

async function debugExplicitEnv() {
	console.log("🚀 Starting Debug with Explicit Env...");

	try {
		// Test 1: Check environment variables
		console.log("\n🔧 Test 1: Environment Variables");
		console.log(
			"Raw process.env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED:",
			process.env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED
		);
		console.log(
			"Parsed env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED:",
			env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED
		);
		console.log("LEMONSQUEEZY_API_KEY exists:", !!env.LEMONSQUEEZY_API_KEY);
		console.log("LEMONSQUEEZY_API_KEY length:", env.LEMONSQUEEZY_API_KEY?.length || 0);

		// Test 2: Initialize providers
		console.log("\n🔄 Test 2: Initializing providers");
		await initializePaymentProviders();

		// Test 3: Check enabled providers after init
		console.log("\n📦 Test 3: Providers after initialization");
		const providersAfter = getEnabledProviders();
		console.log("Enabled providers after init:", providersAfter.length);
		providersAfter.forEach((p) => {
			console.log(
				`  - ${p.id}: ${p.name} (enabled: ${p.isEnabled}, configured: ${p.isConfigured})`
			);
		});
	} catch (error) {
		console.error("❌ Error in explicit env debug:", error);
	}
}

debugExplicitEnv();
