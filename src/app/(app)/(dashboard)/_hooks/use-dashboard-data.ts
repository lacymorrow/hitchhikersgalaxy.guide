import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { createRedirectUrl } from "@/lib/utils/redirect";
import { auth } from "@/server/auth";
import { isAdmin } from "@/server/services/admin-service";
import { checkGitHubConnection } from "@/server/services/github/github-service";
import { PaymentService } from "@/server/services/payment-service";
import { checkVercelConnection } from "@/server/services/vercel/vercel-service";

export async function useDashboardData() {
	const session = await auth({ protect: true });

	if (!session?.user?.id) {
		redirect(createRedirectUrl(routes.auth.signIn, { nextUrl: routes.app.dashboard }));
	}

	const userId = session.user.id;

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
