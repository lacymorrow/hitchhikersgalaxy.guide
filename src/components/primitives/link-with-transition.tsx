/*
 * Link component
 * Allows for page transitions during navigation
 *
 * @see https://nextjs.org/docs/app/api-reference/components/link
 */

import { default as NextLink } from "next/link";
import { Link as TransitionsLink } from "next-view-transitions";
import type React from "react";
import { siteConfig } from "@/config/site-config";

export const Link = ({ children, ...props }: React.ComponentProps<typeof NextLink>) => {
	if (typeof props.href !== "string") {
		props.href = "#";
	}

	if (siteConfig?.behavior?.pageTransitions) {
		const { prefetch: incomingPrefetch, ...restRaw } = props;
		const rest = restRaw as Omit<React.ComponentProps<typeof NextLink>, "prefetch">;
		const normalizedPrefetch: boolean | undefined =
			typeof incomingPrefetch === "boolean" ? incomingPrefetch : undefined;
		return (
			<TransitionsLink prefetch={normalizedPrefetch} {...rest}>
				{children}
			</TransitionsLink>
		);
	}

	return <NextLink {...props}>{children}</NextLink>;
};
