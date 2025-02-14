import { useCallback, useEffect } from "react";
import { AnalyticsService } from "../services/analytics-service";

export const useAnalytics = () => {
    const analytics = AnalyticsService.getInstance();

    // Track page views
    useEffect(() => {
        analytics.trackEvent("page", "view", window.location.pathname);
    }, []);

    // Track user interactions
    const trackEvent = useCallback(
        (
            category: string,
            action: string,
            label?: string,
            value?: number,
            metadata?: Record<string, unknown>,
        ) => {
            analytics.trackEvent(category, action, label, value, metadata);
        },
        [],
    );

    // Track errors
    const trackError = useCallback(
        (
            error: Error | string,
            type: "error" | "warning" = "error",
            metadata?: Record<string, unknown>,
        ) => {
            analytics.trackError(error, type, metadata);
        },
        [],
    );

    // Track render performance
    const trackRenderPerformance = useCallback(
        (
            animationId: string,
            duration: number,
            success: boolean,
            metadata?: Record<string, unknown>,
        ) => {
            analytics.trackRenderPerformance(
                animationId,
                duration,
                success,
                metadata,
            );
        },
        [],
    );

    // Track asset processing performance
    const trackProcessingPerformance = useCallback(
        (
            assetId: string,
            type: string,
            duration: number,
            success: boolean,
            metadata?: Record<string, unknown>,
        ) => {
            analytics.trackProcessingPerformance(
                assetId,
                type,
                duration,
                success,
                metadata,
            );
        },
        [],
    );

    // Track API performance
    const trackApiPerformance = useCallback(
        (
            endpoint: string,
            method: string,
            duration: number,
            status: number,
            metadata?: Record<string, unknown>,
        ) => {
            analytics.trackApiPerformance(
                endpoint,
                method,
                duration,
                status,
                metadata,
            );
        },
        [],
    );

    // Track performance metrics
    const trackMetric = useCallback(
        (
            name: string,
            value: number,
            unit: string,
            metadata?: Record<string, unknown>,
        ) => {
            analytics.trackMetric(name, value, unit, metadata);
        },
        [],
    );

    // Track memory usage
    useEffect(() => {
        const interval = setInterval(() => {
            analytics.trackMemoryUsage();
        }, 60000); // Every minute

        return () => clearInterval(interval);
    }, []);

    // Track frame rate
    useEffect(() => {
        analytics.trackFrameRate();
    }, []);

    return {
        trackEvent,
        trackError,
        trackRenderPerformance,
        trackProcessingPerformance,
        trackApiPerformance,
        trackMetric,
    };
};
