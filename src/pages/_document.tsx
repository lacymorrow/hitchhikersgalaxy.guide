import { Head, Html, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* React Scan */}
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
      </Head>
      <body className="min-h-screen antialiased font-sans font-normal leading-relaxed">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
