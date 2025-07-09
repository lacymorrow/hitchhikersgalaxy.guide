import { config } from "dotenv";

// Load environment variables first
config();

async function debugProviderStatus() {
	console.log("🔧 Environment Variable Debug:");
	console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
	console.log(
		`  LEMONSQUEEZY_API_KEY: ${process.env.LEMONSQUEEZY_API_KEY ? "✅ Set" : "❌ Not set"}`
	);
	console.log(
		`  LEMONSQUEEZY_STORE_ID: ${process.env.LEMONSQUEEZY_STORE_ID ? "✅ Set" : "❌ Not set"}`
	);
	console.log(
		`  NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED: ${process.env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED}`
	);
	console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? "✅ Set" : "❌ Not set"}`);

	// Try to import and initialize providers
	try {
		console.log("\n🏭 Provider Status:");
		const { getEnabledProviders, getProvider } = await import("../src/server/providers/index.js");

		const providers = getEnabledProviders();
		console.log(`  Found ${providers.length} enabled providers`);

		for (const provider of providers) {
			console.log(
				`  - ${provider.name} (${provider.id}): ${provider.isEnabled ? "✅ Enabled" : "❌ Disabled"}`
			);
		}

		// Check Lemon Squeezy specifically
		const lemonSqueezyProvider = getProvider("lemonsqueezy");
		if (lemonSqueezyProvider) {
			console.log(`\n🍋 Lemon Squeezy Provider:`);
			console.log(`  Enabled: ${lemonSqueezyProvider.isEnabled}`);
			console.log(`  Configured: ${lemonSqueezyProvider.isConfigured}`);
		}
	} catch (error) {
		console.error("❌ Error checking providers:", error);
	}

	// Check database
	try {
		console.log("\n🗄️ Database Status:");
		const { isDatabaseInitialized } = await import("../src/server/db/index.js");
		console.log(`  Database initialized: ${isDatabaseInitialized()}`);
	} catch (error) {
		console.error("❌ Error checking database:", error);
	}
}

debugProviderStatus().catch(console.error);
