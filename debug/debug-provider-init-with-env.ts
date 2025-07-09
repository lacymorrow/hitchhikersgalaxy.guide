import { config } from "dotenv";

// Load environment variables from .env file
config();

import { env } from "../src/env";
import { getEnabledProviders, initializePaymentProviders } from "../src/server/providers";

async function debugProviderInit() {
	console.log("🚀 Starting Provider Init Debug with Env Loading...");

	try {
		// Test 1: Check environment variables
		console.log("\n🔧 Test 1: Environment Variables");
		console.log(
			"NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED:",
			env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED
		);
		console.log("LEMONSQUEEZY_API_KEY exists:", !!env.LEMONSQUEEZY_API_KEY);
		console.log("LEMONSQUEEZY_API_KEY length:", env.LEMONSQUEEZY_API_KEY?.length || 0);

		// Test 2: Check enabled providers before init
		console.log("\n📦 Test 2: Providers before initialization");
		const providersBefore = getEnabledProviders();
		console.log("Enabled providers before init:", providersBefore.length);
		providersBefore.forEach((p) => console.log(`  - ${p.id}: ${p.name}`));

		// Test 3: Initialize providers
		console.log("\n🔄 Test 3: Initializing providers");
		await initializePaymentProviders();

		// Test 4: Check enabled providers after init
		console.log("\n📦 Test 4: Providers after initialization");
		const providersAfter = getEnabledProviders();
		console.log("Enabled providers after init:", providersAfter.length);
		providersAfter.forEach((p) => {
			console.log(
				`  - ${p.id}: ${p.name} (enabled: ${p.isEnabled}, configured: ${p.isConfigured})`
			);
		});
	} catch (error) {
		console.error("❌ Error in provider init debug:", error);
	}
}

debugProviderInit();
