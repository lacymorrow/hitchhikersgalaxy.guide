import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { constructMetadata } from "@/config/metadata";
import { hasUserActiveSubscription, hasUserPurchasedProduct } from "@/lib/polar";
import { auth } from "@/server/auth";
import { SubscriptionButton } from "./subscription-button";

export const metadata: Metadata = constructMetadata({
  title: "Subscription Plans",
  description: "Choose a subscription plan that fits your needs.",
});

export default async function SubscriptionsPage() {
  // Get current user session
  const session = await auth();
  const userId = session?.user?.id;

  // Set up subscription and purchase checks
  let hasSubscription = false;
  const purchasedProducts: Record<string, boolean> = {};

  if (userId) {
    // Check if user has an active subscription
    hasSubscription = await hasUserActiveSubscription(userId);

    // Check subscription tiers
    const subscriptionId = process.env.NEXT_PUBLIC_POLAR_SUBSCRIPTION_PRICE_ID ?? "";
    if (subscriptionId) {
      purchasedProducts[subscriptionId] = hasSubscription;
    }

    // Check one-time product
    const oneTimeId = process.env.NEXT_PUBLIC_POLAR_ONE_TIME_PRICE_ID ?? "";
    if (oneTimeId) {
      purchasedProducts[oneTimeId] = await hasUserPurchasedProduct(userId, oneTimeId);
    }
  }

  const subscriptionTiers = [
    {
      id: process.env.NEXT_PUBLIC_POLAR_SUBSCRIPTION_PRICE_ID ?? "",
      name: "Basic",
      description: "Perfect for getting started",
      price: "$9/month",
    },
  ];

  const oneTimeTiers = [
    {
      id: process.env.NEXT_PUBLIC_POLAR_ONE_TIME_PRICE_ID ?? "",
      name: "One-Time",
      description: "Perfect for getting started",
      price: "$5",
    },
  ];

  const tiers = [...subscriptionTiers, ...oneTimeTiers];
  return (
    <div className="container mx-auto py-12">
      <h1 className="mb-12 text-center text-4xl font-bold">Choose Your Plan</h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card key={tier.id} className="flex flex-col">
            <CardHeader className="relative">
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
              {userId && purchasedProducts[tier.id] && (
                <div className="absolute right-4 top-4">
                  {tier.id === process.env.NEXT_PUBLIC_POLAR_SUBSCRIPTION_PRICE_ID ? (
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-blue-500">
                      Purchased
                    </Badge>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-3xl font-bold">{tier.price}</p>
            </CardContent>
            <CardFooter>
              <SubscriptionButton
                tier={tier.id}
                className={`w-full ${userId && purchasedProducts[tier.id] ? "opacity-50" : ""}`}
              />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
