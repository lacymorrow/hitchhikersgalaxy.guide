import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import { WebVitals } from "@/components/primitives/web-vitals";
import { UmamiAnalytics } from "@/lib/umami/umami-analytics";
import { ShipkitStatsigProvider } from "@/lib/statsig/statsig-provider";
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google'
import { env } from "@/env";

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
	return (
		<>
			<ShipkitStatsigProvider>
				{/* Web Vitals - Above children to track page metrics */}
				<WebVitals />

				{children}

				{/* Metrics - Below children to avoid blocking */}
				<SpeedInsights />

				{/* Analytics */}
				{/* Google Analytics - render only when enabled and ID present */}
				{env.NEXT_PUBLIC_FEATURE_GOOGLE_ANALYTICS_ENABLED && env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ? (
					<GoogleAnalytics gaId={env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
				) : null}
				{/* Google Tag Manager - render only when enabled and ID present */}
				{env.NEXT_PUBLIC_FEATURE_GOOGLE_TAG_MANAGER_ENABLED && env.NEXT_PUBLIC_GOOGLE_GTM_ID ? (
					<GoogleTagManager gtmId={env.NEXT_PUBLIC_GOOGLE_GTM_ID} />
				) : null}
				<UmamiAnalytics />
				<VercelAnalytics />
			</ShipkitStatsigProvider>
		</>
	);
};
