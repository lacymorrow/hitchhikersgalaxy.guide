import { buildTimeFeatures } from "@/config/features-config";

/**
 * Check if Cloudflare Turnstile is fully configured.
 * Only returns true if both site key and secret key are set.
 * Call this from Server Components only.
 */
export function isTurnstileConfigured(): boolean {
	return buildTimeFeatures.TURNSTILE_ENABLED;
}

/**
 * Verify a Turnstile token with Cloudflare's API.
 * @param token - The token from the Turnstile widget
 * @returns Promise<boolean> - Whether the token is valid
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
	const secretKey = process.env.TURNSTILE_SECRET_KEY;

	if (!secretKey) {
		console.error("Turnstile secret key not configured");
		return false;
	}

	try {
		const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				secret: secretKey,
				response: token,
			}),
		});

		const data = await response.json();
		return data.success === true;
	} catch (error) {
		console.error("Error verifying Turnstile token:", error);
		return false;
	}
}
