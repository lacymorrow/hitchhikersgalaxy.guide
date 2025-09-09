import type { AppProps } from "next/app";
import { NuqsAdapter } from "nuqs/adapters/next/pages";
import { ShipkitProvider } from "@/components/providers/shipkit-provider";
import { TeamProvider } from "@/components/providers/team-provider";

export default function PagesApp({ Component, pageProps }: AppProps) {
	return (
		<ShipkitProvider session={pageProps.session} pageProps={pageProps}>
			<NuqsAdapter>
				<TeamProvider initialTeams={[{ id: "personal", name: "Personal" }]}>
					<Component {...pageProps} />
				</TeamProvider>
			</NuqsAdapter>
		</ShipkitProvider>
	);
}
