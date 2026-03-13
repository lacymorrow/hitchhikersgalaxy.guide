import type { AnchorHTMLAttributes, ReactNode } from "react";

interface NextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	href: string | URL;
	children?: ReactNode;
}

export default function Link({ href, children, ...props }: NextLinkProps) {
	const resolvedHref = typeof href === "string" ? href : href.toString();
	return (
		<a href={resolvedHref} {...props}>
			{children}
		</a>
	);
}
