import { testPaymentLinking } from "@/lib/lemonsqueezy.test";
import { config } from "dotenv";

// Load environment variables
config();

async function main() {
	try {
		console.log("Starting payment linking test...");
		await testPaymentLinking();
		console.log("Test completed!");
	} catch (error) {
		console.error("Test failed:", error);
	}
}

void main();
