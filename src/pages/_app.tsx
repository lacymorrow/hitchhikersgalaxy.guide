import type { AppProps } from "next/app";
import { ThemeProvider as ShipkitThemeProvider } from "@/components/ui/shipkit/theme";
import { NuqsAdapter } from "nuqs/adapters/next/pages";
import { ShipkitProvider } from "@/components/providers/shipkit-provider";
import { TeamProvider } from "@/components/providers/team-provider";
import { FontProvider } from "@/components/providers/font-provider";

export default function PagesApp({ Component, pageProps }: AppProps) {
	return (
		<ShipkitThemeProvider>
			<ShipkitProvider session={pageProps.session} pageProps={pageProps}>
				<NuqsAdapter>
					<TeamProvider initialTeams={[{ id: "personal", name: "Personal" }]}>
						<FontProvider>

							<Component {...pageProps} />
						</FontProvider>
					</TeamProvider>
				</NuqsAdapter>
			</ShipkitProvider>
		</ShipkitThemeProvider>
	);
}
