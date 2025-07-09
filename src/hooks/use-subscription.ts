"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { checkUserSubscription } from "@/server/actions/payments";

type SubscriptionProvider = "lemonsqueezy" | "polar";

/**
 * Hook to check if the current user has an active subscription
 */
export function useSubscription(provider?: SubscriptionProvider) {
	const { data: session, status } = useSession();
	const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const checkSubscription = async () => {
			if (status === "loading") return;

			if (!session?.user) {
				setHasActiveSubscription(false);
				setIsLoading(false);
				return;
			}

			try {
				console.log(
					`Checking subscription for user ${session.user.email || session.user.id} with provider: ${provider || "all"}`
				);
				const result = await checkUserSubscription(provider);
				setHasActiveSubscription(result.hasSubscription);
				setError(null);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.error("Error checking subscription:", errorMessage);
				setHasActiveSubscription(false);
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		checkSubscription();
	}, [session, status, provider]);

	return {
		hasActiveSubscription,
		isLoading,
		error,
	};
}
