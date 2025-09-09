import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { auth } from "@/server/auth";
import { isAdmin } from "@/server/services/admin-service";
import { checkGitHubConnection } from "@/server/services/github/github-service";
import { PaymentService } from "@/server/services/payment-service";
import { checkVercelConnection } from "@/server/services/vercel/vercel-service";

export async function useDashboardData() {
	const session = await auth({ protect: true });

	// Defensive check: even with protect: true, ensure user exists
	if (!session?.user?.id) {
		redirect(routes.auth.signIn); // Simplified redirect as per new redirect utility
	}

	const userId = session.user.id;

	// Run all async operations in parallel
	const [isUserAdmin, hasGitHubConnection, hasVercelConnection, isCustomer, isSubscribed] =
		await Promise.all([
			isAdmin({ email: session.user.email || "" }),
			checkGitHubConnection(userId),
			checkVercelConnection(userId),
			PaymentService.hasUserPurchasedVariant({
				userId,
				variantId: siteConfig.store.products.shipkit || "",
				provider: "lemonsqueezy",
			}),
			PaymentService.hasUserActiveSubscription({ userId }),
		]);

	return {
		session,
		isUserAdmin,
		hasGitHubConnection,
		hasVercelConnection,
		isCustomer,
		isSubscribed,
	};
}
