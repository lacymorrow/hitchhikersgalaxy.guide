"use client";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

declare global {
	interface Window {
		createLemonSqueezy: () => void;
		LemonSqueezy: {
			Setup: ({ eventHandler }: { eventHandler: (event: any) => void }) => void;
			Url: {
				Close: () => void;
				Open: (url: string) => void;
			};
		};
	}
}

// Helper function to manage body scroll
const toggleBodyScroll = (disable: boolean) => {
	if (disable) {
		// Store the current scroll position
		const scrollY = window.scrollY;
		document.body.style.position = 'fixed';
		document.body.style.width = '100%';
		document.body.style.top = `-${scrollY}px`;
	} else {
		// Restore the scroll position
		const scrollY = document.body.style.top;
		document.body.style.position = '';
		document.body.style.width = '';
		document.body.style.top = '';
		window.scrollTo(0, Number.parseInt(scrollY || '0', 10) * -1);
	}
};

interface LemonSqueezyEvent {
	event: string;
	data: {
		order: {
			meta: {
				test_mode: boolean;
			};
			data: {
				id: string;
				attributes: {
					store_id: number;
					customer_id: number;
					identifier: string;
					order_number: number;
					user_name: string | null;
					user_email: string | null;
					currency: string;
					status: string;
					total: number;
					first_order_item: {
						id: number;
						order_id: number;
						product_id: number;
						variant_id: number;
						product_name: string;
						variant_name: string;
						price: number;
						test_mode: boolean;
					};
					test_mode: boolean;
				};
			};
		};
	};
}

export const BuyButton = () => {
	const { data: session } = useSession();
	const router = useRouter();

	useEffect(() => {
		// Load Lemon.js script
		const script = document.createElement("script");
		script.src = "/scripts/lemon.js";
		script.defer = true;
		document.body.appendChild(script);

		script.onload = () => {
			// Initialize Lemon.js
			window.createLemonSqueezy?.();

			// Setup event handlers
			window.LemonSqueezy?.Setup({
				eventHandler: async (event: LemonSqueezyEvent) => {
					if (!event?.event?.startsWith("Checkout")) {
						return;
					}

					// Handle checkout events
					if (event.event === "Checkout.Success") {
						console.log("Purchase successful!", event);
						// Close the overlay
						window.LemonSqueezy?.Url.Close();
						// Re-enable scrolling
						toggleBodyScroll(false);

						// Construct success URL with order data
						const successUrl = new URL("/checkout/success", window.location.origin);
						const orderData = event.data.order.data;

						// Add order data to URL
						successUrl.searchParams.set("order_id", orderData.attributes.identifier);
						successUrl.searchParams.set("email", orderData.attributes.user_email || "");
						successUrl.searchParams.set("status", orderData.attributes.status);

						// Add custom data that was passed during checkout
						if (session?.user?.id) {
							const customData = {
								user_id: session.user.id,
								user_email: session.user.email,
							};
							successUrl.searchParams.set("custom_data", JSON.stringify(customData));
						}

						toast.success("Purchase successful! Redirecting...");
						router.push(successUrl.toString());
					}
					if (event.event === "Checkout.Closed") {
						console.log("Checkout closed", event);
					}
					console.log("body scroll logic");
					toggleBodyScroll(false); // Re-enable scrolling
				},
			});
		};

		return () => {
			document.body.removeChild(script);
			toggleBodyScroll(false); // Ensure scrolling is re-enabled on unmount
		};
	}, [router, session]);

	const handleClick = () => {
		// Construct the checkout URL with user's email as custom_data
		const checkoutUrl = new URL(routes.external.buy);

		// Add success page URL
		const successUrl = new URL("/checkout/success", window.location.origin);
		checkoutUrl.searchParams.set("checkout[success_url]", successUrl.toString());

		if (session?.user?.email) {
			// Add user data
			checkoutUrl.searchParams.set("checkout[custom][user_email]", session.user.email);
			if (session.user.id) {
				checkoutUrl.searchParams.set("checkout[custom][user_id]", session.user.id);
			}
			// Pre-fill the email field
			checkoutUrl.searchParams.set("checkout[email]", session.user.email);
		}

		// Disable scrolling before opening the overlay
		toggleBodyScroll(true);
		// Open the checkout overlay
		checkoutUrl.searchParams.set("dark", "1");
		window.LemonSqueezy?.Url.Open(checkoutUrl.toString());
	};

	return (
		<Button onClick={handleClick} variant="default">
			Get {siteConfig.name}
		</Button>
	);
};
