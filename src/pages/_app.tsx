import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/pages";
import { ShipkitProvider } from "@/components/providers/shipkit-provider";
import { TypographyProvider } from "@/components/providers/typography-provider";

export default function PagesApp({ Component, pageProps }: AppProps) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system">
			<ShipkitProvider session={pageProps.session} pageProps={pageProps}>
				<NuqsAdapter>
					{/* Needed to get fonts working for the pages router */}
					<TypographyProvider>
						<Component {...pageProps} />
					</TypographyProvider>
				</NuqsAdapter>
			</ShipkitProvider>
		</ThemeProvider>
	);
}
