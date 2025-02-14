"use client";

import {
	type PropsWithChildren,
	createContext,
	useContext,
	useEffect,
} from "react";
import { useAnalytics } from "../hooks/use-analytics";

interface AnalyticsContextValue {
	trackEvent: (
		category: string,
		action: string,
		label?: string,
		value?: number,
		metadata?: Record<string, unknown>,
	) => void;
	trackError: (
		error: Error | string,
		type?: "error" | "warning",
		metadata?: Record<string, unknown>,
	) => void;
	trackRenderPerformance: (
		animationId: string,
		duration: number,
		success: boolean,
		metadata?: Record<string, unknown>,
	) => void;
	trackProcessingPerformance: (
		assetId: string,
		type: string,
		duration: number,
		success: boolean,
		metadata?: Record<string, unknown>,
	) => void;
	trackApiPerformance: (
		endpoint: string,
		method: string,
		duration: number,
		status: number,
		metadata?: Record<string, unknown>,
	) => void;
	trackMetric: (
		name: string,
		value: number,
		unit: string,
		metadata?: Record<string, unknown>,
	) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export const AnalyticsProvider = ({ children }: PropsWithChildren) => {
	const analytics = useAnalytics();

	// Track route changes
	useEffect(() => {
		const handleRouteChange = (url: string) => {
			analytics.trackEvent("navigation", "route_change", url);
		};

		window.addEventListener("popstate", () =>
			handleRouteChange(window.location.pathname),
		);

		return () => {
			window.removeEventListener("popstate", () =>
				handleRouteChange(window.location.pathname),
			);
		};
	}, [analytics]);

	// Track performance metrics
	useEffect(() => {
		if (typeof window !== "undefined") {
			// Track page load performance
			window.addEventListener("load", () => {
				const navigation = performance.getEntriesByType(
					"navigation",
				)[0] as PerformanceNavigationTiming;

				analytics.trackMetric(
					"page_load",
					navigation.loadEventEnd - navigation.startTime,
					"ms",
					{
						dns: navigation.domainLookupEnd - navigation.domainLookupStart,
						tcp: navigation.connectEnd - navigation.connectStart,
						ttfb: navigation.responseStart - navigation.requestStart,
						domLoad:
							navigation.domContentLoadedEventEnd -
							navigation.domContentLoadedEventStart,
					},
				);
			});

			// Track largest contentful paint
			new PerformanceObserver((entryList) => {
				const entries = entryList.getEntries();
				const lastEntry = entries[entries.length - 1];
				if (lastEntry) {
					analytics.trackMetric("lcp", lastEntry.startTime, "ms");
				}
			}).observe({ entryTypes: ["largest-contentful-paint"] });

			// Track first input delay
			new PerformanceObserver((entryList) => {
				const entries = entryList.getEntries();
				for (const entry of entries) {
					const fid = entry as PerformanceEventTiming;
					analytics.trackMetric(
						"fid",
						fid.processingStart - fid.startTime,
						"ms",
					);
				}
			}).observe({ entryTypes: ["first-input"] });

			// Track cumulative layout shift
			// new PerformanceObserver((entryList) => {
			// 	const entries = entryList.getEntries();
			// 	for (const entry of entries) {
			// 		const cls = entry;
			// 		analytics.trackMetric("cls", cls.value, "score", {
			// 			hadRecentInput: cls.hadRecentInput,
			// 		});
			// 	}
			// }).observe({ entryTypes: ["layout-shift"] });

			// Track long tasks
			new PerformanceObserver((entryList) => {
				const entries = entryList.getEntries();
				for (const entry of entries) {
					analytics.trackMetric("long_task", entry.duration, "ms", {
						name: entry.name,
						startTime: entry.startTime,
					});
				}
			}).observe({ entryTypes: ["longtask"] });
		}
	}, [analytics]);

	return (
		<AnalyticsContext.Provider value={analytics}>
			{children}
		</AnalyticsContext.Provider>
	);
};

export const useAnalyticsContext = () => {
	const context = useContext(AnalyticsContext);
	if (!context) {
		throw new Error(
			"useAnalyticsContext must be used within an AnalyticsProvider",
		);
	}
	return context;
};
