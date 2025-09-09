import { Head, Html, Main, NextScript } from "next/document";
import { headLinkHints, type HeadLinkHint } from "@/config/metadata";

export default function Document() {
	return (
		<Html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
			<Head>
				<meta charSet="utf-8" />
				<link rel="icon" href="/favicon.ico" />
				{headLinkHints.map((l: HeadLinkHint) => (
					<link key={`${l.rel}-${l.href}`} rel={l.rel} href={l.href} crossOrigin={l.crossOrigin} />
				))}
			</Head>
			<body className="min-h-screen antialiased">
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
