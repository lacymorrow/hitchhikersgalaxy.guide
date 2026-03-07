import { Head, Html, Main, NextScript } from "next/document";
import { reactGrabConfig } from "@/config/react-grab-config";
import { headLinkHints, type HeadLinkHint } from "@/config/metadata";
import { env } from "@/env";

export default function Document() {
	return (
		<Html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
			<Head>
				<meta charSet="utf-8" />
				<link rel="icon" href="/favicon.ico" />
				{headLinkHints.map((l: HeadLinkHint) => (
					<link key={`${l.rel}-${l.href}`} rel={l.rel} href={l.href} crossOrigin={l.crossOrigin} />
				))}

				{env.NEXT_PUBLIC_FEATURE_DEVTOOLS_ENABLED && (
					<script
						async
						defer
						crossOrigin="anonymous"
						src="https://tweakcn.com/live-preview.min.js"
					/>
				)}
				{process.env.NODE_ENV === "development" && reactGrabConfig.enabled && reactGrabConfig.provider && (
					<>
						<script
							crossOrigin="anonymous"
							src="https://unpkg.com/react-grab/dist/index.global.js"
						/>
						<script crossOrigin="anonymous" src={reactGrabConfig.provider.clientScriptUrl} />
					</>
				)}
			</Head>
			<body className="min-h-screen antialiased">
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
