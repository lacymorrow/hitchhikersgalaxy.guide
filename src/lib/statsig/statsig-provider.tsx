"use client";
import { env } from "@/env";

import React from "react";
import { StatsigProvider, useClientAsyncInit } from '@statsig/react-bindings';
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics';
import { StatsigSessionReplayPlugin } from '@statsig/session-replay';
import { PageViewTracker } from "./statsig-pageview";

interface ProviderProps {
    children: React.ReactNode;
}

// Lightweight wrapper to lazily initialize client only when enabled and key present
export function ShipkitStatsigProvider({ children }: ProviderProps) {
    const clientKey = env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
    const user = { userID: undefined as string | undefined };

    const { client } = useClientAsyncInit(
        clientKey ?? "",
        user,
        { plugins: [new StatsigAutoCapturePlugin(), new StatsigSessionReplayPlugin()] },
    );

    if (!env.NEXT_PUBLIC_FEATURE_STATSIG_ENABLED) {
        return children;
    }

    if (!clientKey) {
        // Feature flag enabled by build-time detection, but key missing at runtime
        return children;
    }

    if (!client) {
        return children;
    }

    return (
        <StatsigProvider client={client}>
            <PageViewTracker />
            {children}

        </StatsigProvider>
    );
}
