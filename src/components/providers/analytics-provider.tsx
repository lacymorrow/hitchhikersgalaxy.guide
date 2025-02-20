import { WebVitals } from "@/components/primitives/web-vitals";
import { PostHogProvider } from "@/lib/posthog/posthog-provider";
import { UmamiAnalytics } from "@/lib/umami/umami-analytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import type { ReactNode } from "react";

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
	return (
		<>
			<PostHogProvider>
				{/* Web Vitals - Above children to track page metrics */}
				<WebVitals />

				{children}

				{/* Metrics - Below children to avoid blocking */}
				<UmamiAnalytics />
				<VercelAnalytics />
			</PostHogProvider>
		</>
	);
};
