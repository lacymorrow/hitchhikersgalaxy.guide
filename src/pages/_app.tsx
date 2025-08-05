import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/pages";
import { Prose } from "@/components/primitives/prose";
import { ShipkitProvider } from "@/components/providers/shipkit-provider";

export default function PagesApp({ Component, pageProps }: AppProps) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system">
			<ShipkitProvider session={pageProps.session} pageProps={pageProps}>
				<NuqsAdapter>
					{/* Needed to get fonts working for the pages router */}
					<Prose>
						<Component {...pageProps} />
					</Prose>
				</NuqsAdapter>
			</ShipkitProvider>
		</ThemeProvider>
	);
}
