import "@/styles/globals.css";
import Head from "next/head";

import { Space_Grotesk as FontSans, Noto_Serif as FontSerif } from "next/font/google";

import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCReactProvider } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import HolyLoader from "holy-loader";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ViewTransitions } from "next-view-transitions";
import { Suspense, type ReactNode } from "react";
import { PageTracker } from "react-page-tracker";
import { WebVitals } from "../primitives/web-vitals";
import { JsonLd } from "@/components/primitives/json-ld";
import { Analytics } from "@vercel/analytics/react";
import { ErrorToast } from "@/components/primitives/error-toast";
import { PostHogProvider } from "@/lib/posthog/posthog-provider";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";

const fontSerif = FontSerif({
	weight: ["400", "500", "600", "700"],
	style: ["normal", "italic"],
	subsets: ["latin"],
	variable: "--font-serif",
});

const fontSans = FontSans({
	display: "swap",
	subsets: ["latin"],
	variable: "--font-sans",
});

export function RootLayout({ children }: { children: ReactNode }) {
	return (
		<ViewTransitions>
			<Head>
				{/* React Scan */}
				<script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
			</Head>
			<html lang="en" suppressHydrationWarning>
				<body
					className={cn(
						"min-h-screen antialiased",
						"font-sans font-normal leading-relaxed",
						fontSans.variable,
						fontSerif.variable
					)}
				>
					<JsonLd organization website />
					<HolyLoader
						showSpinner
						height={"4px"}
						color={"linear-gradient(90deg, #FF61D8, #8C52FF, #5CE1E6, #FF61D8)"}
					/>
					<PageTracker />
					<SessionProvider>
						<TRPCReactProvider>
							<ThemeProvider attribute="class" defaultTheme="dark">
								<TooltipProvider delayDuration={100}>
									<AnalyticsProvider>
										{/* Content */}
										{children}


										{/* Toast - Display messages to the user */}
										<SonnerToaster />

										{/* Error Toast - Display error messages to the user based on search params */}
										<Suspense>
											<ErrorToast />
										</Suspense>
									</AnalyticsProvider>
								</TooltipProvider>
							</ThemeProvider>
						</TRPCReactProvider>
					</SessionProvider>
				</body>
			</html>
		</ViewTransitions>
	);
}
