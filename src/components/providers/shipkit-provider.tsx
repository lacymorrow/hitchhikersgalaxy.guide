import { ErrorToast } from "@/components/primitives/error-toast";
import { JsonLd } from "@/components/primitives/json-ld";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { KeyboardShortcutProvider } from "@/components/providers/keyboard-shortcut-provider";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as LegacyToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCReactProvider } from "@/lib/trpc/react";
// import ConsentProvider from "@/components/providers/consent-provider";

import HolyLoader from "holy-loader";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { Suspense } from "react";

import "@/styles/globals.css";

interface ShipkitProviderProps {
	children: ReactNode;
	/**
	 * Session data for Next Auth
	 */
	session?: any;
	/**
	 * Page props for TRPC
	 */
	pageProps?: any;
}

/**
 * Main provider component that wraps all providers used in the application
 * Can be used in both App Router and Pages Router
 */
export function ShipkitProvider({ children, session, pageProps }: ShipkitProviderProps) {
	return (
		<>
			<JsonLd organization website />
			<HolyLoader
				showSpinner
				height={"4px"}
				color={"linear-gradient(90deg, #FF61D8, #8C52FF, #5CE1E6, #FF61D8)"}
			/>
			<SessionProvider session={session}>
				<TRPCReactProvider {...pageProps}>
					<TooltipProvider delayDuration={100}>
						<AnalyticsProvider>
							{/* <ConsentProvider> */}

							<KeyboardShortcutProvider>
								{/* Content */}
								{children}

								{/* Toast - Display messages to the user */}
								<Toaster />

								<LegacyToaster />

								{/* Error Toast - Display error messages to the user based on search params */}
								<Suspense>
									<ErrorToast />
								</Suspense>
							</KeyboardShortcutProvider>
							{/* </ConsentProvider> */}
						</AnalyticsProvider>
					</TooltipProvider>
				</TRPCReactProvider>
			</SessionProvider>
		</>
	);
}
