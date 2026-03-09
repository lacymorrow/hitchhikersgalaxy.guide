"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { getUserPaymentStatus } from "@/server/actions/payments";

export function LemonSqueezyCheckoutButton() {
	const { data: session } = useSession();

	const handleClick = async () => {
		if (!session?.user?.email) {
			console.error("No user email found");
			return;
		}

		try {
			const userId = session.user.id;
			const email = session.user.email;

			// Check if user has already paid using Server Action
			const hasPaid = await getUserPaymentStatus();

			if (hasPaid) {
				// console.log("User has already paid");
				// Redirect logic or UI update can go here
				// e.g., router.push("/dashboard");
				return;
			}

			// Create checkout URL
			const checkoutUrl = `https://shipkit.lemonsqueezy.com/checkout/buy/xxx?checkout[email]=${encodeURIComponent(
				email
			)}&checkout[custom][user_id]=${encodeURIComponent(userId)}`;

			// Redirect to checkout
			window.location.href = checkoutUrl;
		} catch (error) {
			console.error("Error creating checkout:", error);
		}
	};

	return (
		<Button onClick={handleClick} size="lg">
			Buy Now
		</Button>
	);
}
