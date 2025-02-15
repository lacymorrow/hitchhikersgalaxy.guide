"use server";

import { routes } from "@/config/routes";
import { logger } from "@/lib/logger";
import { auth } from "@/server/auth";
import { getOrdersByEmail } from "@/lib/lemonsqueezy";
import { redirect } from "next/navigation";

/**
 * Server action to handle the repository download request.
 * This is a two-step process:
 * 1. Verify authentication and authorization
 * 2. Redirect to the download route handler which will stream the file
 *
 * Using redirect() instead of returning Response objects avoids
 * serialization issues between Server and Client Components.
 */
export async function downloadRepo() {
	// Redirect to the download route handler
	redirect(routes.api.download);
}

/**
 * Server action to handle the repository download request.
 * This is a two-step process:
 * 1. Verify authentication and authorization
 * 2. Redirect to the download route handler which will stream the file
 *
 * Using redirect() instead of returning Response objects avoids
 * serialization issues between Server and Client Components.
 */
export async function downloadRepoAnonymously(formData: FormData) {
	redirect(
		`${routes.api.download}?email=${formData.get("email")}&orderId=${formData.get("orderId")}`,
	);
}
