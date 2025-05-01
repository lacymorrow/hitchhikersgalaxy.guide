"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme";
import { UserMenu } from "@/components/ui/user-menu";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { getConfig } from "@/app/(app)/[...slug]/config";
import { cn } from "@/lib/utils";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useWindowScroll } from "@uidotdev/usehooks";
import { cva } from "class-variance-authority";
import { useSession } from "next-auth/react";
import { Link } from "@/components/primitives/link-with-transition";
import type React from "react";
import { useMemo } from "react";

import { Search } from "@/components/search/search";
import styles from "@/styles/header.module.css";

interface NavLink {
	href: string;
	label: string;
	isCurrent?: boolean;
}

interface HeaderProps {
	navLinks?: NavLink[];
	logoHref?: string;
	logoIcon?: React.ReactNode;
	logoText?: string;
	searchPlaceholder?: string;
	variant?: "default" | "sticky" | "floating";
	clientId?: string;
}

const headerVariants = cva(
	"translate-z-0 z-50 p-md",
	{
		variants: {
			variant: {
				default: "relative",
				floating: "sticky top-0 h-24",
				sticky: "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

export const Header: React.FC<HeaderProps> = ({
	logoHref = routes.home,
	logoIcon,
	logoText,
	navLinks = [],
	variant = "default",
	clientId,
}) => {
	const [{ y }] = useWindowScroll();
	const isOpaque = useMemo(() => variant === "floating" && y && y > 100, [y, variant]);
	const { data: session } = useSession();

	// Get client-specific configuration
	const config = getConfig(clientId);
	const displayText = logoText || siteConfig.name;

	// Apply client-specific styling
	const clientStyling = config?.styling || {};

	return (
		<>
			<header
				className={cn(
					headerVariants({ variant }),
					variant === "floating" && styles.header,
					variant === "floating" && isOpaque && styles.opaque,
					variant === "floating" &&
					isOpaque &&
					"-top-[12px] [--background:#fafafc70] dark:[--background:#1c1c2270]"
				)}
				style={{
					// Apply client-specific primary color if available
					...(clientStyling.primaryColor && {
						'--brand-primary': clientStyling.primaryColor
					} as React.CSSProperties)
				}}
			>
				{variant === "floating" && <div className="h-[12px] w-full" />}
				<nav className="container flex items-center justify-between gap-md">
					<div className="hidden flex-col gap-md md:flex md:flex-row md:items-center">
						<Link
							href={logoHref}
							className="flex grow items-center gap-2 text-lg font-semibold md:mr-6 md:text-base"
						>
							{logoIcon || (
								<img
									src="/placeholder-logo.svg"
									alt={displayText}
									className="h-8 w-auto"
								/>
							)}
							<span className="block whitespace-nowrap">{displayText}</span>
						</Link>
						<Search />
					</div>

					<Sheet>
						<SheetTrigger asChild>
							<Button variant="outline" size="icon" className="shrink-0 md:hidden">
								<HamburgerMenuIcon className="h-5 w-5" />
								<span className="sr-only">Toggle navigation menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left">
							<nav className="grid gap-6 font-medium">
								<Link href={logoHref} className="flex items-center gap-2 text-lg font-semibold">
									{logoIcon || (
										<img
											src="/placeholder-logo.svg"
											alt={displayText}
											className="h-8 w-auto"
										/>
									)}
									<span className="sr-only">{displayText}</span>
								</Link>
								{navLinks.map((link) => (
									<Link
										key={`${link.href}-${link.label}`}
										href={link.href}
										className={cn(
											"text-muted-foreground hover:text-foreground",
											link.isCurrent ? "text-foreground" : ""
										)}
									>
										{link.label}
									</Link>
								))}
							</nav>
						</SheetContent>
					</Sheet>
					<div className="flex items-center gap-2 md:ml-auto lg:gap-4">
						<div className="hidden items-center justify-between gap-md text-sm md:flex">
							{navLinks.map((link) => (
								<Link
									key={`${link.href}-${link.label}`}
									href={link.href}
									className={cn(
										"transition-colors hover:text-foreground",
										link.isCurrent ? "text-foreground" : "text-muted-foreground"
									)}
								>
									{link.label}
								</Link>
							))}
						</div>
						<div className="flex items-center gap-2">
							{!session && <ThemeToggle variant="ghost" size="icon" className="rounded-full" />}
							<UserMenu size="sm" />
						</div>
					</div>
				</nav>
			</header>
			{variant === "floating" && <div className="-mt-24" />}
		</>
	);
};
