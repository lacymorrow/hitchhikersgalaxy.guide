import type React from "react";
import { default as NextLink, type LinkProps as NextLinkProps } from "next/link";
import { Link as TransitionsLink } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { siteConfig } from "@/config/site-config";
import { Button } from "@/components/ui/button";

interface CustomLinkProps {
	variant?: "default" | "button";
	withRedirect?: boolean;
	withTransition?: boolean;
}

type LinkProps = NextLinkProps & CustomLinkProps & { children: React.ReactNode };

export const Link = ({ children, variant = "default", withRedirect = false, withTransition, ...props }: LinkProps) => {
	const pathname = usePathname();

	const href = useMemo(() => {
		let newHref = typeof props.href === "string" ? props.href : props.href.href ?? "";
		if (withRedirect) {
			const redirectTo = pathname;
			if (redirectTo && typeof window !== "undefined") {
				const nextUrl = new URL(redirectTo, window.location.origin);
				const params = new URLSearchParams();
				params.set(SEARCH_PARAM_KEYS.nextUrl, String(nextUrl));
				newHref = `${newHref}?${String(params)}`;
			}
		}
		return newHref;
	}, [props.href, withRedirect, pathname]);

	const useTransition = withTransition ?? siteConfig?.behavior?.pageTransitions;

	const LinkComponent = useTransition ? TransitionsLink : NextLink;

	if (variant === "button") {
		return (
			<LinkComponent {...props} href={href}>
				<Button>{children}</Button>
			</LinkComponent>
		);
	}

	return (
		<LinkComponent {...props} href={href}>
			{children}
		</LinkComponent>
	);
};