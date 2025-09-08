"use client";

import Link from "next/link";
import { type ComponentPropsWithoutRef, type ReactNode, Suspense } from "react";
import { OAuthButtons } from "@/app/(app)/(authentication)/_components/oauth-buttons";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuthForm } from "../_hooks/use-auth-form";
import { AuthFooter } from "./auth-footer";
import { AuthHeader } from "./auth-header";

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
	const {
		cardTitle,
		cardDescription,
		alternateLink,
		shouldShowAlternateLink,
		showAuthUnavailable,
	} = useAuthForm(mode, title, description);

	return (
		<div className={cn("flex flex-col gap-6 overflow-y-auto", className)} {...props}>
			{withHeader && (
				<AuthHeader
					title={cardTitle}
					description={cardDescription}
					showAuthUnavailable={showAuthUnavailable}
				/>
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
			{withFooter && <AuthFooter />}
		</div>
	);
}
