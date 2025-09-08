"use client";
import { useEffect } from "react";
import { env } from "@/env";
import { StatsigProvider, useStatsigClient } from "@statsig/react-bindings";

interface ProviderProps {
    children: React.ReactNode;
}

// Lightweight wrapper to lazily initialize client only when enabled and key present
export function ShipkitStatsigProvider({ children }: ProviderProps) {
    if (!env.NEXT_PUBLIC_FEATURE_STATSIG_ENABLED) {
        return children;
    }

    const clientKey = env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
    if (!clientKey) {
        // Feature flag enabled by build-time detection, but key missing at runtime
        return children;
    }

    const user = { userID: undefined as string | undefined };
    console.log("ShipkitStatsigProvider", env.NEXT_PUBLIC_FEATURE_STATSIG_ENABLED);

    return (
        <StatsigProvider sdkKey={clientKey} user={user}>
            <PageViewTracker />
            {children}

        </StatsigProvider>
    );
}

function PageViewTracker() {
    const { client } = useStatsigClient();

    useEffect(() => {
        if (!client) return;
        // Optional: capture an initial page view event
        client.logEvent("$pageview");
    }, [client]);

    return null;
}


