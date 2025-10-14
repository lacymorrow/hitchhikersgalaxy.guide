import type { AppProps } from "next/app";
import { NuqsAdapter } from "nuqs/adapters/next/pages";
import { ShipkitProvider } from "@/components/providers/shipkit-provider";
import { TeamProvider } from "@/components/providers/team-provider";
import { env } from "@/env";
import { TailwindIndicator } from "@/components/modules/devtools/tailwind-indicator";
import { FontSelector } from "@/components/modules/devtools/font-selector";

export default function PagesApp({ Component, pageProps }: AppProps) {
	const devtoolsEnabled = env.NEXT_PUBLIC_FEATURE_DEVTOOLS_ENABLED;
	return (
		<ShipkitProvider session={pageProps.session} pageProps={pageProps}>
			<NuqsAdapter>
				<TeamProvider initialTeams={[{ id: "personal", name: "Personal" }]}>
					<Component {...pageProps} />
					{process.env.NODE_ENV === "development" && devtoolsEnabled && (
						<>
							<TailwindIndicator />
							<FontSelector />
						</>
					)}
				</TeamProvider>
			</NuqsAdapter>
		</ShipkitProvider>
	);
}
