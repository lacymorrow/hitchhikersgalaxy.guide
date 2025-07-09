"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";

const className = "text-inherit";

export function SignInOutButton() {
	const { data: session } = useSession();

	const handleSignOut = async () => {
		await signOutAction();
	};

	if (!session?.user) {
		return (
			<Link
				className={cn(buttonVariants({ variant: "link" }), className)}
				href={routes.auth.signIn}
			>
				Login
			</Link>
		);
	}

	return (
		<form action={handleSignOut}>
			<Button type="submit" variant="link" className={className}>
				Logout
			</Button>
		</form>
	);
}

export { SignInOutButton as LoginOutButton };
