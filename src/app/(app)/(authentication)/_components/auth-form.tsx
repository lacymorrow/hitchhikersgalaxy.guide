"use client";

import Link from "next/link";
import { type ComponentPropsWithoutRef, type ReactNode, Suspense } from "react";
import { OAuthButtons } from "@/app/(app)/(authentication)/_components/oauth-buttons";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { env } from "@/env";
import { cn } from "@/lib/utils";

// Compute guest-only mode on the client using build-time flags to avoid importing server code

interface AuthFormProps extends ComponentPropsWithoutRef<"div"> {
	mode: "sign-in" | "sign-up";
	children?: ReactNode;
	title?: string;
	description?: string;
	withHeader?: boolean;
	withFooter?: boolean;
}

export function AuthForm({
	mode = "sign-in",
	className,
	children,
	title,
	description,
	withHeader = true,
	withFooter = true,
	...props
}: AuthFormProps) {
	const isSignIn = mode === "sign-in";
	const cardTitle =
		typeof title === "string"
			? title
			: isSignIn
				? `Welcome to ${siteConfig.title}`
				: "Create an account";
	const cardDescription =
		typeof description === "string"
			? description
			: isSignIn
				? "Login to get started"
				: "Sign up to get started";
	const alternateLink = isSignIn
		? { text: "Don't have an account?", href: routes.auth.signUp, label: "Sign up" }
		: { text: "Already have an account?", href: routes.auth.signIn, label: "Sign in" };

	/*
	 * Hide the sign-up link when in guest-only mode since users can create their own names
	 * without traditional authentication methods
	 */
	const isGuestOnlyMode =
		!!env.NEXT_PUBLIC_FEATURE_AUTH_GUEST_ENABLED && !env.NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED;
	const shouldShowAlternateLink = !isGuestOnlyMode && !!env.NEXT_PUBLIC_FEATURE_AUTH_ENABLED;
	const hasAnyAuthEnabled = env.NEXT_PUBLIC_FEATURE_AUTH_ENABLED;
	const showAuthUnavailable = !isGuestOnlyMode && !hasAnyAuthEnabled;

	return (
		<div className={cn("flex flex-col gap-6 overflow-y-auto", className)} {...props}>
			{withHeader && (
				<CardHeader className="text-center">
					<CardTitle className="text-xl">{cardTitle}</CardTitle>
					{!showAuthUnavailable && <CardDescription>{cardDescription}</CardDescription>}
				</CardHeader>
			)}
			<CardContent className="pb-0">
				<div className="grid gap-6 relative">
					{showAuthUnavailable && (
						<div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
							<span aria-hidden="true">&gt;</span>
							<span>Login and sign-up are not available at this time.</span>
						</div>
					)}

					{!showAuthUnavailable && (
						<>
							<OAuthButtons collapsible variant="icons" />
							<Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
						</>
					)}
					{shouldShowAlternateLink && !showAuthUnavailable && (
						<div className="text-center text-sm">
							{alternateLink.text}{" "}
							<Link href={alternateLink.href} className="underline underline-offset-4">
								{alternateLink.label}
							</Link>
						</div>
					)}
				</div>
			</CardContent>
			<CardFooter>
				{withFooter && (
					<div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
						By signing up, you agree to our <Link href={routes.terms}>Terms of Service</Link> and{" "}
						<Link href={routes.privacy}>Privacy Policy</Link>.
					</div>
				)}
			</CardFooter>
		</div>
	);
}
