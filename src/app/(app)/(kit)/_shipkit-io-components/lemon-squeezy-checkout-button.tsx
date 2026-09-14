"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { getUserPaymentStatus } from "@/server/actions/payments";

const CHECKOUT_BASE_URL = routes.external.buy;

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

      if (!userId) {
        console.error("No user ID found in session");
        return;
      }

      const hasPaid = await getUserPaymentStatus();

      if (hasPaid) {
        return;
      }

      const url = new URL(CHECKOUT_BASE_URL);
      url.searchParams.set("checkout[email]", email);
      url.searchParams.set("checkout[custom][user_id]", userId);

      window.location.href = url.toString();
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
