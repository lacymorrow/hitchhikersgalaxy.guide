import type { Metadata, Viewport } from "next";
import React from "react";

import { AppRouterLayout } from "@/components/layouts/app-router-layout";
import { headLinkHints, type HeadLinkHint, metadata as defaultMetadata, viewport as sharedViewport } from "@/config/metadata";
import { initializePaymentProviders } from "@/server/providers";
import { FontSelector } from "@/app/(app)/dev/_components/font-selector";
import { cn } from "@/lib/utils";

export const metadata: Metadata = defaultMetadata;
export const fetchCache = "default-cache";
export const viewport: Viewport = sharedViewport;

await initializePaymentProviders();

export default async function Layout({
	children,
	...slots
}: {
	children: React.ReactNode;
	[key: string]: React.ReactNode;
}) {
	// Intercepting routes
	const resolvedSlots = (
		await Promise.all(
			Object.entries(slots).map(async ([key, slot]) => {
				const resolvedSlot = slot instanceof Promise ? await slot : slot;
				if (
					!resolvedSlot ||
					(typeof resolvedSlot === "object" && Object.keys(resolvedSlot).length === 0)
				) {
					return null;
				}
				return [key, resolvedSlot] as [string, React.ReactNode];
			})
		)
	).filter((item): item is [string, React.ReactNode] => item !== null);

	return (
		<html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
			<head>
				{headLinkHints.map((l: HeadLinkHint) => (
					<link key={`${l.rel}-${l.href}`} rel={l.rel} href={l.href} crossOrigin={l.crossOrigin} />
				))}
			</head>
			<body className="min-h-screen antialiased">
				<AppRouterLayout>
					<main>{children}</main>

					{/* Dynamically render all available slots */}
					{resolvedSlots.map(([key, slot]) => (
						<React.Fragment key={`slot-${key}`}>{slot}</React.Fragment>
					))}

					{/* TODO: Uncomment this when we have this working */}
					{/* Lacy Morrow vanity plate */}
					{/* <BrickMarquee /> */}
				</AppRouterLayout>

				{/* Add FontSelector only in development */}
				{process.env.NODE_ENV === "development" && <FontSelector />}
			</body>
		</html>
	);
}
