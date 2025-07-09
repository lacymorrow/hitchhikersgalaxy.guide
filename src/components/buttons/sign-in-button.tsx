"use client";

import { usePathname } from "next/navigation";
import type React from "react";
import { Link } from "@/components/primitives/link-with-transition";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { cn } from "@/lib/utils";

export const SignInButton = ({
	className,
	children = "Login",
	size = "default",
	variant = "link",
	nextUrl,
}: {
	className?: string;
	children?: React.ReactNode;
	size?: "default" | "sm" | "lg" | "icon";
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
	nextUrl?: string;
}) => {
	const pathname = usePathname();

	return (
		<Link
			href={`${routes.auth.signIn}?${SEARCH_PARAM_KEYS.nextUrl}=${nextUrl ?? pathname}`}
			className={cn(buttonVariants({ variant, size }), className)}
		>
			{children}
		</Link>
	);
};

export { SignInButton as LoginButton };
